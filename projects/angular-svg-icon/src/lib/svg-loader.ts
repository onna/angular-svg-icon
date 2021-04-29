import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable()
export abstract class SvgLoaderTest {
    abstract getSvg(url: string): Observable<string>;
}
@Injectable({ providedIn: 'root' })
export class SvgLoader extends SvgLoaderTest {
    constructor(private http: HttpClient) {
        super();
    }
    getSvg(url: string): Observable<string> {
        return this.http.get(url, { responseType: 'text' });
    }
}
