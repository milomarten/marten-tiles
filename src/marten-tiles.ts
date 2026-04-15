import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';

@customElement('marten-tiles')
export class MartenTiles extends LitElement {
  // @property({ type: String }) header = 'My app';

  static styles = css`
    .logo {
      margin-top: 36px;
      animation: app-logo-spin infinite 20s linear;
      width: fit-content;
    }

    @keyframes app-logo-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `;

  render() {
    return html`
      <main>
        <p class="logo">Hello, World!</p>
      </main>
    `;
  }
}
