/**
 * Printer Controller
 *
 * @author Wellington Estevo
 * @version 1.6.4
 */

import { log } from '@propz/helpers.ts';
import { Buffer } from 'node:buffer'; // To download images if necessary
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import usb from 'usb';

import type { ImageBuffer, Pixel, PrintAlertEvents, WebSocketData } from '@propz/types.ts';
import type { OutEndpoint } from 'usb';

export default class PrintController
{
	private events: PrintAlertEvents = {
		// Events
		follow: {
			title: 'Willkommen',
			text: 'Vielen Dank für den Follow: <br>Willkommen im Design & Code Club!'
		},
		// 'chatscore-100': { 'title': '[count] Chat-Newbie' },
		// 'chatscore-500': { 'title': '[count] Chat-Enthusiast' },
		'chatscore-1000': { title: 'Chat-Veteran' },
		'chatscore-2000': { title: 'Chat-Guru' },
		'chatscore-3000': { title: 'Chat-Meister' },
		'chatscore-4000': { title: 'Chat-Experte' },
		'chatscore-5000': { title: 'Chat-Champion' },
		'chatscore-6000': { title: 'Chat-Legende' },
		'chatscore-7000': { title: 'Chat-Hero' },
		'chatscore-8000': { title: 'Chat-Koryphäe' },
		'chatscore-9000': { title: 'Chat-Meistergeist' },
		'chatscore-10000': { title: 'Chat-Göttlichkeit' },
		cheer: {
			title: '[count]x Cheeeeeeers!!',
			text: 'Danke für die Cheers,<br>du machst den Stream bunter!'
		},
		communitysub: {
			title: 'Subs für alle',
			text: 'Danke für die [count]-Fache<br>Abo-Liebe für den Stream!'
		},
		'communitysub-2': {
			title: 'Mega Sub Geschenk',
			text: 'Vielen Dank für die [count]x<br>geschenkte Coding-Extravaganz!'
		},
		kofidonation: {
			title: 'Danke für die Moneten',
			text: 'Vielen Dank für die [count] Moneten<br>und die hammermäßige Unzterstüzung!'
		},
		// 'kofishoporder': { 'title': 'Shoppingfieber', 'text': 'Style haben oder nicht? Haben!' },
		// 'kofisubscription': { 'title': 'Danke für den Sub' },
		// 'raid': { 'title': '[count] Raid-Alarm' },
		'resub-1': {
			title: 'Resub mit Ehre',
			text: 'Vielen Dank für deine<br>anhaltende Abo-Liebe!'
		},
		'resub-2': {
			title: 'Resub mit Mega Ehre',
			text: 'Herzlich willkommen zurück<br>im Abo-Universum > [count]x<br />und kein Ende in Sicht!'
		},
		'resub-3': {
			title: 'Resub mit Omega Ehre',
			text: 'Herzlichen Dank für Resub [count],<br>dein Support ist unübertroffen!'
		},
		sub: {
			title: 'Absolute Sub-Ehre!',
			text: 'Vielen Dank für das Abonnement - so gestalten wir die Code-Welt!'
		},
		subgift: {
			title: 'Geschenk im Anmarsch',
			text: 'Danke fürs Teilen des Abo-Glücks,<br>du machst den Stream strahlender!'
		}
	};

	// Printer Vendor and product ID
	private VID = 0x04b8;
	private PID = 0x0202;

	public async print( eventDetail: WebSocketData )
	{
		if ( await !this.isPrinterOnline() ) return;
		if ( !eventDetail ) return;
		const { type, user, count = 0 } = eventDetail;

		const dataToPrint = await this.setupData( type, user, count || 0 );
		if ( !dataToPrint ) return;

		this.printData( dataToPrint );
	}

	private async isPrinterOnline()
	{
		let device: usb.usb.Device | undefined;
		try
		{
			device = await usb.findByIds( this.VID, this.PID );
			if ( !device ) return false;
			return true;
		}
		catch ( _error: unknown )
		{
			return false;
		}
	}

	private formatDate( date: Date )
	{
		if ( !date ) return '';
		const formattedDate = `${date.getDate().toString().padStart( 2, '0' )}.${
			( date.getMonth() + 1 ).toString().padStart( 2, '0' )
		}.${date.getFullYear()} - ${date.getHours().toString().padStart( 2, '0' )}:${
			date.getMinutes().toString().padStart( 2, '0' )
		}:${date.getSeconds().toString().padStart( 2, '0' )}`;
		return `Date: ${formattedDate}`;
	}

	// Save image to file and return buffer
	private async generateAndSaveImage( type: string, user: string, count: number )
	{
		// HTML-Datei einlesen
		let htmlContent = await Deno.readTextFileSync( './local-scripts/PrintTemplate.html' );

		let title = this.events?.[type]?.title ?? 'Omega Danke';
		title = title.replaceAll( '[count]', count.toString() );
		let text = this.events?.[type]?.text ?? 'Sehr geil!';
		text = text.replaceAll( '[count]', count.toString() );

		if ( type.includes( 'chatscore' ) )
			text = `>> ${count} <<`;

		htmlContent = htmlContent.replaceAll( '[[user]]', user );
		htmlContent = htmlContent.replaceAll( '[[text]]', text );
		htmlContent = htmlContent.replaceAll( '[[title]]', title );
		// htmlContent = htmlContent.replaceAll( '[[profilePictureUrl]]', profilePictureUrl );
		htmlContent = htmlContent.replaceAll( '[[count]]', count.toString() );
		htmlContent = htmlContent.replaceAll( '[[date]]', this.formatDate( new Date() ) );

		const imageBuffer = await this.generateImageFromHTML( htmlContent );
		return imageBuffer;
	}

	private async generateImageFromHTML( htmlContent: string )
	{
		try
		{
			const puppeteerArgs = [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-accelerated-2d-canvas',
				'--no-first-run',
				'--no-zygote',
				'--single-process',
				'--disable-gpu'
			];
			const browser = await puppeteer.launch( { args: puppeteerArgs } );
			const page = await browser.newPage();

			await page.setContent( htmlContent, { waitUntil: 'networkidle0' } );

			// Wait for the content to be rendered
			const element = await page.waitForSelector( '#window', { visible: true } );
			if ( !element )
			{
				log( new Error( 'No element found' ) );
				return;
			}

			// Get the height of the element
			const elementHeight = await page.evaluate( () =>
			{
				const element = document.querySelector( '#window' ) as HTMLElement;
				return element?.offsetHeight || 0;
			} );

			await page.setViewport( { width: 480 - 7, height: elementHeight } );

			const screenshotBuffer = await element.screenshot();
			await page.close();
			await browser.close();

			return screenshotBuffer;
		}
		catch ( error: unknown )
		{
			log( error );
		}
	}

	private closestNDivisibleBy8( n: number )
	{
		return Math.floor( n / 8 ) * 8;
	}

	private async convertBufferToEscPosImage( imgBuffer: ImageBuffer )
	{
		try
		{
			// Load the image
			const { data, info } = await sharp( imgBuffer )
				.ensureAlpha()
				.raw()
				.toBuffer( { resolveWithObject: true } );

			const width = info.width;
			const height = info.height;
			const pixels = this.convertToPixelArray( data, width, height );

			this.removeTransparency( pixels );

			const printWidth = this.closestNDivisibleBy8( width );
			const printHeight = this.closestNDivisibleBy8( height );
			const bytes = this.rasterize( printWidth, printHeight, pixels );

			const imageHeader = Buffer.from( [ 0x1d, 0x76, 0x30, 0x00 ] );
			const imageData = Buffer.concat( [
				imageHeader,
				Buffer.from( [
					( printWidth >> 3 ) & 0xff,
					( ( printWidth >> 3 ) >> 8 ) & 0xff,
					printHeight & 0xff,
					( printHeight >> 8 ) & 0xff
				] ),
				bytes
			] );

			return imageData;
		}
		catch ( error )
		{
			log( error );
		}
	}

	private convertToPixelArray( data: ImageBuffer, width: number, height: number )
	{
		const pixels: Pixel[][] = [];
		for ( let y = 0; y < height; y++ )
		{
			const row: Pixel[] = [];
			for ( let x = 0; x < width; x++ )
			{
				const idx = ( y * width + x ) * 4;
				row.push( {
					R: data[idx],
					G: data[idx + 1],
					B: data[idx + 2],
					A: data[idx + 3]
				} );
			}
			pixels.push( row );
		}
		return pixels;
	}

	private removeTransparency( pixels: Pixel[][] )
	{
		const height = pixels.length;
		const width = pixels[0].length;
		for ( let y = 0; y < height; y++ )
		{
			for ( let x = 0; x < width; x++ )
			{
				const pixel = pixels[y][x];
				const alpha = pixel.A;
				const invAlpha = 255 - alpha;

				pixel.R = ( alpha * pixel.R + invAlpha * 255 ) / 255;
				pixel.G = ( alpha * pixel.G + invAlpha * 255 ) / 255;
				pixel.B = ( alpha * pixel.B + invAlpha * 255 ) / 255;
				pixel.A = 255;
			}
		}
	}

	private rasterize( printWidth: number, printHeight: number, pixels: Pixel[][] )
	{
		if ( printWidth % 8 !== 0 || printHeight % 8 !== 0 )
			throw new Error( 'printWidth and printHeight must be multiples of 8' );

		const bytes = Buffer.alloc( ( printWidth * printHeight ) >> 3 );
		for ( let y = 0; y < printHeight; y++ )
		{
			for ( let x = 0; x < printWidth; x += 8 )
			{
				const i = ( y * printWidth ) / 8 + x / 8;
				bytes[i] = ( this.getPixelValue( x + 0, y, pixels ) << 7 ) |
					( this.getPixelValue( x + 1, y, pixels ) << 6 ) |
					( this.getPixelValue( x + 2, y, pixels ) << 5 ) |
					( this.getPixelValue( x + 3, y, pixels ) << 4 ) |
					( this.getPixelValue( x + 4, y, pixels ) << 3 ) |
					( this.getPixelValue( x + 5, y, pixels ) << 2 ) |
					( this.getPixelValue( x + 6, y, pixels ) << 1 ) |
					this.getPixelValue( x + 7, y, pixels );
			}
		}
		return bytes;
	}

	private getPixelValue( x: number, y: number, pixels: Pixel[][] )
	{
		const pixel = pixels[y][x];
		return pixel.R > 0 ? 0 : 1;
	}

	// 42 columns
	private async setupData( type: string, user: string, count: number )
	{
		if ( !this.events[type] ) return;

		const imageBuffer = await this.generateAndSaveImage( type, user, count );
		if ( !imageBuffer ) return;

		const image = await this.convertBufferToEscPosImage( imageBuffer );
		return image;
	}

	private async printData( data: ImageBuffer )
	{
		let device: usb.usb.Device | undefined;

		try
		{
			device = await usb.findByIds( this.VID, this.PID );

			if ( !device )
			{
				log( new Error( 'Printer not found' ) );
				return;
			}
		}
		catch ( error: unknown )
		{
			log( error );
			return;
		}

		device.__open();
		device.__claimInterface( 0 );
		device.open();
		// log( 'Printer connection opened' );

		const deviceInterface = device.interface( 0 );
		deviceInterface.claim();
		// log( 'Printer interface claimed' );

		const outEndpoint = deviceInterface.endpoint( 0x01 ) as OutEndpoint;
		if ( !outEndpoint )
		{
			log( new Error( 'Endpoint not found' ) );
			return;
		}
		// const inEndpoint = interface.endpoint(0x82);
		// log( 'Printer endpoint ready' );

		outEndpoint.transfer( data as Buffer, ( error: unknown, actual: number ) =>
		{
			if ( error )
				log( error );
			else
				log( `Image sent › ${actual} bytes transfered` );
		} );
	}
}
