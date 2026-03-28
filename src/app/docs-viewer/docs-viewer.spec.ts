import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocsViewer } from './docs-viewer';

describe('DocsViewer', () => {
  let component: DocsViewer;
  let fixture: ComponentFixture<DocsViewer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocsViewer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocsViewer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
