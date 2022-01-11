import { Model } from './model';
import { normalizeVec3, sum, Vec3 } from '../matrices';

function genTriangles(initial: number[]): number[] {
    const newArray: number[][] = [];
    for (let i = 0; i < initial.length; i += 9) {

        const a: Vec3 = [
            initial[i + 0],
            initial[i + 1],
            initial[i + 2],
        ];
        const b: Vec3  = [
            initial[i + 3],
            initial[i + 4],
            initial[i + 5],
        ];
        const c: Vec3  = [
            initial[i + 6],
            initial[i + 7],
            initial[i + 8],
        ];

        const d: Vec3 = normalizeVec3(sum(a, b));
        const e: Vec3 = normalizeVec3(sum(b, c));
        const f: Vec3 = normalizeVec3(sum(a, c));

        newArray.push(a);
        newArray.push(d);
        newArray.push(f);

        newArray.push(d);
        newArray.push(b);
        newArray.push(e);

        newArray.push(f);
        newArray.push(e);
        newArray.push(c);

        newArray.push(d);
        newArray.push(e);
        newArray.push(f);
    }
    return newArray.flat();
}

function genNormales(triangles: number[]): number[] {
    const normales: number[][] = [];
    for (let i = 0; i < triangles.length; i += 9) {
        const a: Vec3  = [
            triangles[i + 0],
            triangles[i + 1],
            triangles[i + 2],
        ];
        const b: Vec3  = [
            triangles[i + 3],
            triangles[i + 4],
            triangles[i + 5],
        ];
        const c: Vec3  = [
            triangles[i + 6],
            triangles[i + 7],
            triangles[i + 8],
        ];
        const avg = (sum(a, sum(b, c)));
        normales.push(avg);
        normales.push(avg);
        normales.push(avg);
    }
    return normales.flat();
}

export class Sphere extends Model {


    constructor(gl: WebGLRenderingContext) {
   
        let itri = [            
            0,  0, 1,
            0, -1, 0,
            1,  0, 0,

            0, 0, 1,
            1, 0, 0,
            0, 1, 0,

            0,  0, 1,
            -1,  0, 0,
            0, -1, 0,

            0, 0, 1,
            0, 1, 0,
            -1, 0, 0,

            0,  0, -1,
            1,  0, 0,
            0, -1, 0,

            1, 0, 0,
            0, 0, -1,
            0, 1, 0,

            0,  0, -1,
            0, -1, 0,
            -1,  0, 0,

            0, 0, -1,
            -1, 0, 0,
            0, 1, 0,
        ];

        for (let i = 0; i < 2; i++) {
            itri = genTriangles(itri);
        }

        const normales = genNormales(itri);

        const indices = [];
        for (let i = 0; i < normales.length; i += 3) {
            indices.push(i / 3);
        }
        const color = [1.0, 0.0, 0.0, 1.0];

        super(
            gl,
            itri,
            normales,
            indices,
            (new Array(Math.ceil(itri.length / 3)))
                .fill(color, 0)
                .flat(),
        );
    }

}