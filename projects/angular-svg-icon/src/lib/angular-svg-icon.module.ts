import { ModuleWithProviders, NgModule, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SVG_ICON_REGISTRY_PROVIDER } from './svg-icon-registry.service';
import { SvgIconComponent } from './svg-icon.component';
import { SvgLoader, SvgLoaderTest } from './svg-loader';
export interface AngularSvgIconConfig {
    loader?: Provider;
}
@NgModule({
    imports: [CommonModule],
    declarations: [SvgIconComponent],
    exports: [SvgIconComponent],
})
export class AngularSvgIconModule {
    static forRoot(config: AngularSvgIconConfig = {}): ModuleWithProviders<AngularSvgIconModule> {
        return {
            ngModule: AngularSvgIconModule,
            providers: [SVG_ICON_REGISTRY_PROVIDER, config.loader || { provide: SvgLoader }],
        };
    }
}
