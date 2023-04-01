import domready from "domready"
import "./style.css"
import SimplexNoise from "simplex-noise"
import Color from "./Color"
import { easeInOutCubic, easeInOutQuint, easeOutCubic, easeOutQuint } from "./easing"
import { randomPaletteWithBlack } from "./randomPalette"

const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 0,
    height: 0
};

/**
 * @type CanvasRenderingContext2D
 */
let ctx;
let canvas;
let noise

const tmp0 = new Color(0,0,0)
const tmp1 = new Color(0,0,0)
const tmp2 = new Color(0,0,0)


function fract(n)
{
    return n - Math.floor(n)
}


function shuffle(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}


function pickRandom(palette, count)
{
    let tmp = []

    while(tmp.length < count)
    {
        tmp = tmp.concat(palette)
    }

    const shuffled = shuffle(tmp)
    return shuffled.slice(0, count)
}


function renderColorField(colors)
{
    const { width, height } = config
    const imageData = ctx.getImageData(0, 0, width, height)

    const {data} = imageData

    const ns0 = 0.0011
    const ns1 = 0.0013
    const ns2 = 0.0013

    let off = 0

    const xf = Math.floor(width / 200) / width
    const yf = Math.floor(height / 200) / height

    const xo = Math.round(Math.random() * 10)
    const yo = Math.round(Math.random() * 10)

    for (let y = 0; y < height; y++)
    {
        for (let x = 0; x < width; x++)
        {
            const xl = x * xf + noise.noise3D(x * ns0, y * ns1, 0)
            const yl = y * yf + noise.noise3D(x * ns0, y * ns1, 1)
            const tx = fract(xl)
            const ty = fract(yl)

            const col = colors[(((tx > 0.5) + (ty > 0.5) * 2) + (Math.floor(xl + xo) ^ Math.floor(yl + yo))) & 3]

            data[off] = col.r
            data[off + 1] = col.g
            data[off + 2] = col.b
            data[off + 3] = 255

            off += 4
        }
    }
    ctx.putImageData(imageData, 0, 0)
}


function distance(x0, y0, x1, y1)
{
    const dx = x1 - x0
    const dy = y1 - y0

    return Math.sqrt(dx * dx + dy * dy)
}


function streak(width = 20)
{
    const { width : w, height : h } = config

    const x0 = Math.round(w * Math.random());
    const y0 = Math.round(h * Math.random());

    const x1 = Math.round(w * Math.random());
    const y1 = Math.round(h * Math.random());

    const dist = distance(x0,y0,x1,y1);

    const len = (2000 * Math.pow(Math.random(), 0.5)) * (Math.random() < 0.5 ? 1: -1)

    const dx = x1 - x0
    const dy = y1 - y0
    const nx =  dy * len/dist
    const ny = -dx * len/dist

    const cx =  (x0+x1)/2 + nx
    const cy =  (y0+y1)/2 + ny

    const r = distance(x0,y0,cx,cy);

    const a0 = Math.atan2(y0 - cy, x0 - cx)
    const a1 = Math.atan2(y1 - cy, x1 - cx)

    const steps = Math.ceil(Math.abs(a0-a1) * r/width) * 2
    const ad = (a1-a0)/(steps-1);
    let a = a0
    let t = 0.2
    let td = 0.6/(steps-1)
    for (let i = 0; i < steps; i++)
    {
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;

        const lineWidth = Math.max(width * 0.1, Math.sin( t * TAU/2 ) * (width * (1 + Math.random() * 0.4)))

        ctx.beginPath()
        ctx.moveTo(x + lineWidth, y)
        ctx.arc(x, y,lineWidth,0,TAU, true)
        ctx.fill()

        a += ad;
        t += td;
    }



}


domready(
    () => {

        canvas = document.getElementById("screen");
        ctx = canvas.getContext("2d");

        const width = (window.innerWidth) | 0;
        const height = (window.innerHeight) | 0;

        config.width = width;
        config.height = height;

        canvas.width = width;
        canvas.height = height;

        const paint = () => {
            noise = new SimplexNoise()
            const colors = pickRandom(randomPaletteWithBlack(), 4).map(c => Color.from(c))

            renderColorField(colors)

            // for (let i = 0; i < 10; i++)
            // {
            //     ctx.fillStyle = colors[0|Math.random() * colors.length].toRGBHex()
            //     streak()
            // }
        }

        paint()

        canvas.addEventListener("click", paint, true)
    }
);
