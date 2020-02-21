import { ModuleWithProviders, NgModule, Optional, Provider, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SVG_ICON_REGISTRY_PROVIDER } from './svg-icon-registry.service';
import { SvgIconComponent } from './svg-icon.component';
import { SvgHttpLoader, SvgLoader } from './svg-loader';

export interface AngularSvgIconConfig {
	loader?: Provider;
}

@NgModule({
	imports: [
		CommonModule,
	],
	declarations: [
		SvgIconComponent
	],
	exports: [ SvgIconComponent ]
})
export class AngularSvgIconModule {

	constructor(@Optional() @SkipSelf() parentModule?: AngularSvgIconModule) {
		if (parentModule) {
			throw new Error('AngularSvgIconModule is already loaded. Import in the AppModule only.');
		}
	}

	static forRoot(config: AngularSvgIconConfig = {}): ModuleWithProviders {
		return {
			ngModule: AngularSvgIconModule,
			providers: [
				SVG_ICON_REGISTRY_PROVIDER,
				config.loader || { provide: SvgLoader, useClass: SvgHttpLoader }
			]
		};
	}
}
