import { ChangeDetectorRef, Component, DoCheck, ElementRef, Input,
	KeyValueChangeRecord, KeyValueChanges, KeyValueDiffer, KeyValueDiffers,
	OnChanges, OnDestroy, OnInit, Renderer2, SimpleChanges } from '@angular/core';

import { Subscription } from 'rxjs';

import { SvgIconRegistryService } from './svg-icon-registry.service';

@Component({
	selector: 'svg-icon',
	template: '<ng-content></ng-content>'
})
export class SvgIconComponent implements OnInit, OnDestroy, OnChanges, DoCheck {
	@Input() src: string;
	@Input() name: string;
	@Input() stretch = false;
	/** @deprecated since 9.1.0 */
	@Input() applyCss = false;
	@Input() svgClass: string;
	// tslint:disable-next-line:no-input-rename
	@Input('class') klass: string;
	@Input() viewBox: string;

	// Adapted from ngStyle
	@Input()
	set svgStyle(v: {[key: string]: string }) {
		this._svgStyle = v;
		if (!this.differ && v) {
			this.differ = this.differs.find(v).create();
		}
	}

	private svg: SVGElement;
	private icnSub: Subscription;
	private differ: KeyValueDiffer<string, string|number>;
	private _svgStyle: {[key: string]: string};
	private loaded = false;

	constructor(
		private element: ElementRef,
		private differs: KeyValueDiffers,
		private renderer: Renderer2,
		private iconReg: SvgIconRegistryService,
		private cdr: ChangeDetectorRef) {
	}

	ngOnInit() {
		this.init();
	}

	ngOnDestroy() {
		this.destroy();
	}

	ngOnChanges(changeRecord: SimpleChanges) {
		if (changeRecord.src || changeRecord.name) {
			if (this.loaded) {
				this.destroy();
			}
			this.init();
		}
		if (changeRecord.stretch) {
			this.stylize();
		}
		if (changeRecord.svgClass) {
			this.setClass(changeRecord.svgClass.previousValue, changeRecord.svgClass.currentValue);
		}
		if (changeRecord.klass) {
			this.setClass(changeRecord.klass.previousValue, changeRecord.klass.currentValue);
		}
		if (changeRecord.viewBox) {
			if (this.loaded) {
				this.destroy();
			}
			this.init();
		}
		if (changeRecord.applyCss) {
			console.warn('applyCss deprecated since 9.1.0, will be removed in 10.0.0');
		}
	}

	ngDoCheck() {
		if (this.svg && this.differ) {
			const changes = this.differ.diff(this._svgStyle);
			if (changes) {
				this.applyChanges(changes);
			}
		}
	}

	private init() {
		if (this.name) {
			this.icnSub = this.iconReg.getSvgByName(this.name).subscribe(this.initSvg.bind(this));
		} else if (this.src) {
			this.icnSub = this.iconReg.loadSvg(this.src).subscribe(this.initSvg.bind(this));
		} else {
			const elem = this.element.nativeElement;
			elem.innerHTML = '';
			this.cdr.markForCheck();
		}
	}

	private initSvg(svg: SVGElement): void {
		if (!this.loaded) {
			this.setSvg(svg);
			this.resetDiffer();
		}
	}

	private destroy() {
		this.svg = undefined;
		this.differ = undefined;
		this.loaded = false;
		if (this.icnSub) {
			this.icnSub.unsubscribe();
		}
	}

	private resetDiffer() {
		if (this._svgStyle && !this.differ) {
			this.differ = this.differs.find(this._svgStyle).create();
		}
	}

	private setSvg(svg: SVGElement) {
		if (!this.loaded && svg) {
			this.svg = svg;
			const icon = svg.cloneNode(true) as SVGElement;
			const elem = this.element.nativeElement;

			this.copyNgContentAttribute(elem, icon);
			this.renderer.setAttribute(icon, 'class', this.klass);

			if (this.svgClass) {
				this.renderer.setAttribute(icon, 'class', this.svgClass);
			}

			if (this.viewBox) {
				if (this.viewBox === 'auto') {
					// Attempt to convert height & width to a viewBox.
					const h = icon.getAttribute('height');
					const w = icon.getAttribute('width');
					if (h && w) {
						const vb = `0 0 ${h} ${w}`;
						this.renderer.setAttribute(icon, 'viewBox', vb);
						this.renderer.removeAttribute(icon, 'height');
						this.renderer.removeAttribute(icon, 'width');
					}
				} else if (this.viewBox !== '') {
					this.renderer.setAttribute(icon, 'viewBox', this.viewBox);
					this.renderer.removeAttribute(icon, 'height');
					this.renderer.removeAttribute(icon, 'width');
				}
			}

			elem.innerHTML = '';
			this.renderer.appendChild(elem, icon);
			this.loaded = true;

			this.stylize();
			this.cdr.markForCheck();
		}
	}

	private copyNgContentAttribute(hostElem: any, icon: SVGElement) {
		const attributes = hostElem.attributes as NamedNodeMap;
		const len = attributes.length;
		for (let i = 0; i < len; i += 1) {
			const attribute = attributes.item(i);
			if (attribute.name.startsWith('_ngcontent')) {
				this.setNgContentAttribute(icon, attribute.name);
				break;
			}
		}
	}

	private setNgContentAttribute(parent: Node, attributeName: string) {
		this.renderer.setAttribute(parent, attributeName, '');
		const len = parent.childNodes.length;
		for (let i = 0; i < len; i += 1) {
			const child = parent.childNodes[i];
			if (child instanceof Element) {
				this.setNgContentAttribute(child, attributeName);
			}
		}
	}

	private stylize() {
		if (this.svg) {
			const svg = this.element.nativeElement.firstChild;

			if (this.stretch === true) {
				this.renderer.setAttribute(svg, 'preserveAspectRatio', 'none');
			} else if (this.stretch === false) {
				this.renderer.removeAttribute(svg, 'preserveAspectRatio');
			}
		}
	}

	private applyChanges(changes: KeyValueChanges<string, string|number>) {
		changes.forEachRemovedItem((record: KeyValueChangeRecord<string, string|number>) => this.setStyle(record.key, null));
		changes.forEachAddedItem((record: KeyValueChangeRecord<string, string|number>) => this.setStyle(record.key, record.currentValue));
		changes.forEachChangedItem((record: KeyValueChangeRecord<string, string|number>) => this.setStyle(record.key, record.currentValue));
	}

	private setStyle(nameAndUnit: string, value: string|number|null|undefined) {
		const [name, unit] = nameAndUnit.split('.');
		value = value !== null && unit ? `${value}${unit}` : value;
		const svg = this.element.nativeElement.firstChild;

		if (value !== null) {
			this.renderer.setStyle(svg, name, value as string);
		} else {
			this.renderer.removeStyle(svg, name);
		}
	}

	private setClass(previous: string, current: string) {
		const svg = this.element.nativeElement.firstChild;
		if (svg) {
			if (previous) {
				this.renderer.removeClass(svg, previous);
			}
			if (current) {
				this.renderer.addClass(svg, current);
			}
		}
	}
}
