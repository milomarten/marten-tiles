import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import './map-canvas.js';

@customElement('marten-tiles')
export class MartenTiles extends LitElement {
  // @property({ type: String }) header = 'My app';

  static styles = css`
    .logo {
      margin-top: 36px;
    }
  `;

  render() {
    return html`
      <main>
        <p class="logo">Generator!!!!!!!</p>
        <map-canvas></map-canvas>
      </main>
    `;
  }
}
