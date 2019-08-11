import { ModuleWithProviders, NgModule, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SVG_ICON_REGISTRY_PROVIDER } from './svg-icon-registry.service';
import { SvgIconComponent } from './svg-icon.component';
import { SvgHttpLoader, SvgLoader } from './svg-loader';

export interface AngularSvgIconConfig {
	loader?: Provider;
}

@NgModule({
	imports:	  [
		CommonModule,
	],
	declarations: [ SvgIconComponent ],
	providers:    [ SVG_ICON_REGISTRY_PROVIDER, { provide: SvgLoader, useClass: SvgHttpLoader } ],
	exports:      [ SvgIconComponent ]
})
export class AngularSvgIconModule {

	static forRoot(config: AngularSvgIconConfig = {}): ModuleWithProviders {
		return {
			ngModule: AngularSvgIconModule,
			providers: [
				config.loader || { provide: SvgLoader, useClass: SvgHttpLoader },
				SVG_ICON_REGISTRY_PROVIDER
			]
		};
	}
}
