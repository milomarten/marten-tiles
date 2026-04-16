import { LitElement, html, css, PropertyValueMap, CSSResultGroup } from 'lit';
import { property, customElement, query } from 'lit/decorators.js';
import { CellLevel1, createRandomMap } from './generation/map-creator.js';

@customElement('map-canvas')
export class MapCanvas extends LitElement {
    @query("canvas") canvas!: HTMLCanvasElement;

    // static styles = css`
    //     canvas {
    //         background-size: 500px 500px;
    //     }
    // `;

    render() {
        return html`
            <canvas id="output" width="500" height="500"></canvas>
        `;
    }

    protected async firstUpdated() {
        const map = createRandomMap({
            width: 20,
            height: 20
        });
        
        this.canvas.height = 20 * 20;
        this.canvas.width = 20 * 20;
        const ctx = this.canvas.getContext("2d");
        if (ctx) {
            map.forEach((x, y, item) => {
                const spreadX = x * 20;
                const spreadY = y * 20;
                if (item == CellLevel1.OBSTACLE) {
                    ctx.fillStyle = "black";
                } else {
                    ctx.fillStyle = "green";
                }
                ctx.fillRect(spreadX+1, spreadY+1, 18, 18);
            })
        }
    }
}