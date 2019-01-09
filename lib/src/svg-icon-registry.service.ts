import { Inject, Injectable, InjectionToken, Optional, SkipSelf } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, of as observableOf, throwError as observableThrowError } from 'rxjs';
import { map, tap, catchError, finalize, share } from 'rxjs/operators';

import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export const SERVER_URL = new InjectionToken<string>('SERVER_URL');

@Injectable()
export class SvgIconRegistryService {

	private document: Document;
	private iconsByUrl = new Map<string, SVGElement>();
	private iconsLoadingByUrl = new Map<string, Observable<SVGElement>>();

	constructor(private http: HttpClient,
				@Inject(PLATFORM_ID) private platformId: Object,
				@Optional() @Inject(SERVER_URL) protected serverUrl: string,
				@Optional() @Inject(DOCUMENT) private _document: any) {
			this.document = this._document;
	}

	/** Add a SVG to the registry by passing a name and the SVG. */
	addSvg(name: string, data: string) {
		if (!this.iconsByUrl.has(name)) {
			const div = this.document.createElement('DIV');
			div.innerHTML = data;
			const svg = <SVGElement>div.querySelector('svg');
			this.iconsByUrl.set(name, svg);
		}
	}

	/** Load a SVG to the registry from a URL. */
	loadSvg(url: string, name: string = url) : Observable<SVGElement> {

		// not sure if there should be a possibility to use name for server usage
		// so overriding it for now if provided
		// maybe should separate functionality for url and name use-cases
		if (this.serverUrl && url.match(/^(http(s)?):/) === null) {
			url = this.serverUrl + url;
			name = url;
		}

		if (this.iconsByUrl.has(name)) {
			return observableOf(this.iconsByUrl.get(name));
		} else if (this.iconsLoadingByUrl.has(name)) {
			return this.iconsLoadingByUrl.get(name);
		}
		const o = <Observable<SVGElement>> this.http.get(url, { responseType: 'text' }).pipe(
			map(svg => {
				const div = this.document.createElement('DIV');
				div.innerHTML = svg;
				return <SVGElement>div.querySelector('svg');
			}),
			tap (svg => this.iconsByUrl.set(name, svg) ),
			catchError(err => {
				console.error(err);
				return observableThrowError(err);
			}),
			finalize(() => this.iconsLoadingByUrl.delete(name) ),
			share()
		);

		this.iconsLoadingByUrl.set(name, o);
		return o;
	}

	/** Get loaded SVG from registry by name. (also works by url because of blended map) */
	getSvgByName(name: string) : Observable<SVGElement> {
		if (this.iconsByUrl.has(name)) {
			return observableOf(this.iconsByUrl.get(name));
		} else if (this.iconsLoadingByUrl.has(name)) {
			return this.iconsLoadingByUrl.get(name);
		}
		return observableThrowError(`No svg with name '${name}' has been loaded`);
	}

	/** Remove a SVG from the registry by URL (or name). */
	unloadSvg(url: string) {
		if (this.iconsByUrl.has(url)) {
			this.iconsByUrl.delete(url);
		}
	}
}

export function SVG_ICON_REGISTRY_PROVIDER_FACTORY(parentRegistry: SvgIconRegistryService, http: HttpClient,
	platformId: Object, serverUrl?: string, document?: any) {
	return parentRegistry || new SvgIconRegistryService(http, platformId,  serverUrl, document);
}

export const SVG_ICON_REGISTRY_PROVIDER = {
	provide: SvgIconRegistryService,
	deps: [ [new Optional(), new SkipSelf(), SvgIconRegistryService], HttpClient, [PLATFORM_ID as InjectionToken<any>],
			[new Optional(), SERVER_URL as InjectionToken<string>], [new Optional(), DOCUMENT as InjectionToken<any>]
	],
	useFactory: SVG_ICON_REGISTRY_PROVIDER_FACTORY
};
