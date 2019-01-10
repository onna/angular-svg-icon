import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export abstract class SvgLoader {
	abstract getSvg(url: string): Observable<string>;
}

@Injectable()
export class SvgHttpLoader extends SvgLoader {

	constructor(private http: HttpClient) {
		super();
	}

	getSvg(url: string): Observable<string> {
		return this.http.get(url, { responseType: 'text' });
	}
}
