import domready from "domready"
import "./style.css"
import SimplexNoise from "simplex-noise"
import Color from "./Color"
import { easeInOutCubic, easeInOutQuint, easeOutCubic, easeOutQuint } from "./easing"
import { randomPaletteWithBlack } from "./randomPalette"
import { clamp } from "./util"

const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 0,
    height: 0,
    colors: []
};

/**
 * @type CanvasRenderingContext2D
 */
let ctx;
let canvas;
let noise

const tmp = new Color(0,0,0)
const tmp2 = new Color(0,0,0)
const tmp3 = new Color(0,0,0)
const tmp4 = new Color(0,0,0)


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

function wrap(n, max)
{
    const m = n % max
    if (m < 0)
    {
        return max + m
    }
    else
    {
        return Math.abs(m)
    }
}

function randomPair(colors)
{
    const idxA = 0|Math.random() * colors.length
    let idxB
    do
    {
        idxB = 0|Math.random() * colors.length

    } while (idxA === idxB)

    return [colors[idxA], colors[idxB]]
}


function renderTiles(tiles)
{
    const { width, height, colors } = config
    const imageData = ctx.getImageData(0, 0, width, height)

    const {data} = imageData

    const ns0 = 0.0011
    const ns1 = 0.0013
    const ns2 = 0.44
    const ns3 = 0.22

    let off = 0

    const noiseX = Math.random()
    const noiseY = Math.random()
    const noiseX2 = Math.random()
    const noiseY2 = Math.random()

    const { widthInTiles, heightInTiles, grid , size} = tiles

    const strength = tiles.size * 2

    const [top, bottom] = randomPair(colors)

    for (let y = 0; y < height; y++)
    {
        top.mix(bottom, y/height, tmp2)

        for (let x = 0; x < width; x++)
        {

            const n0 = noise.noise3D(x * ns0, y * ns1, noiseX)
            const n1 = noise.noise3D(x * ns0, y * ns1, noiseY)

            const n2 = noise.noise3D(x * ns2, y * ns3, noiseX2)
            const n3 = noise.noise3D(x * ns2, y * ns3, noiseY2)

            const fineX = x + n0 * strength
            const fineY = y + n1 * strength
            const tx = Math.floor(fineX / size)
            const ty = Math.floor(fineY / size)
            const tileX = wrap(tx, widthInTiles);
            const tileY = wrap(ty, heightInTiles);

            const fx = clamp(fract((fineX - tx * size)/size) * ( 1 + n2 * 0.25))
            const fy = clamp(fract((fineY - ty * size)/size ) * ( 1 + n3 * 0.25))

            const tile = grid[tileX + tileY * widthInTiles]

            const { color, alt, gradient } = tile
            color.mix(alt, n2 * n3, tmp4 )
            if (gradient !== false)
            {
                const { color: colorB } = grid[wrap(tileX + gradient[0], widthInTiles) + wrap(tileY + gradient[1], heightInTiles) * widthInTiles ]

                const [gx,gy] = gradient

                let t
                if (gx)
                {
                    t = gx < 0 ? Math.min(1, fx * 2) : Math.max(0,(fx - 0.5) * 2)
                }
                else
                {
                    t = gy < 0 ? Math.min(1, fy * 2) : Math.max(0,(fy - 0.5) * 2)
                }

                tmp4.mix(colorB, t, tmp)

                tmp.mix(tmp2, 0.3, tmp3)
            }
            else
            {
                tmp4.mix(tmp2, 0.9, tmp3)

            }
            data[off] = tmp3.r
            data[off + 1] = tmp3.g
            data[off + 2] = tmp3.b
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

const directions = [
    [1,0],
    [0,1],
    [-1,0],
    [0,-1],
]

const NONE = [0,0]

function createTiles(size)
{
    const { width : w, height : h, colors } = config

    const cx = w >> 1
    const cy = h >> 1

    const widthInTiles = Math.ceil(w / size) + 2
    const heightInTiles = Math.ceil(h / size) + 2

    const grid = []

    const x = cx - (widthInTiles * size >> 1)
    const y = cy - (heightInTiles * size >> 1)

    for (let y = 0; y < heightInTiles; y++)
    {
        for (let x = 0; x < widthInTiles; x++)
        {
            const [color,alt] = randomPair(colors);

            grid.push({
                color,
                alt,
                gradient: false
            })
        }
    }

    const numGradients = Math.round(widthInTiles * heightInTiles)
    for (let i = 0; i < numGradients; i++)
    {
        const x = 1 + Math.floor((widthInTiles - 2) * Math.random())
        const y = 1 + Math.floor((heightInTiles - 2) * Math.random())

        const idx = 0 | Math.random() * directions.length
        const dir = directions[idx]
        const opp = directions[(idx + 2) & 3]

        const off = (x,y, dir = NONE) => widthInTiles * (y + dir[1]) + x + dir[0]

        const o0 = off(x,y)
        const o1 = off(x,y,dir)


        const tileA = grid[o0]
        const tileB = grid[o1]

        tileA.gradient = dir;
        tileB.gradient = opp;
    }


    return {
        x,
        y,
        size,
        widthInTiles,
        heightInTiles,

        grid
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
            const colors = randomPaletteWithBlack().map(c => Color.from(c))
            config.colors = colors

            const tiles = createTiles(300)

            renderTiles(tiles)

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
