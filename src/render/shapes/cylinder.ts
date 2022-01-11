import { Model } from './model';
import { normalizeVec3 } from '../matrices';

export class Cylinder extends Model {


    constructor(gl: WebGLRenderingContext) {
   
        
        const anglesAmount = 16;

        const items: number[][] = [];

        for (let i = 0; i <= anglesAmount; i++) {
            const angle = i * Math.PI * 2 / anglesAmount;
            const x = Math.sin(angle);
            const y = Math.cos(angle);
            items.push([x, y]);
        }

        const triangles: number[][] = [];
        const normales: number[][] = [];

        for (let i = 0; i < anglesAmount; i++) {
            const a = items[i];
            const b = items[i + 1];

            const x1 = a[0];
            const x2 = b[0];
            const y1 = a[1];
            const y2 = b[1];

            const E = [ x1, y1, -1.0 ];
            const F = [ x1, y1, 1.0];
            const G = [ x2, y2, 1.0 ];
            const H = [x2, y2, -1.0];           

            const O1 = [0, 0, 1.0];
            const O2 = [0, 0, -1.0];

            const NR = normalizeVec3([ F[0] + G[0], F[1] + G[1], 0 ]);
            const NO1 = [0, 0, 1.0];
            const NO2 = [0, 0, -1.0];

            triangles.push(E);
            triangles.push(F);
            triangles.push(H);

            normales.push(NR);
            normales.push(NR);
            normales.push(NR);

            triangles.push(F);
            triangles.push(G);
            triangles.push(H);

            normales.push(NR);
            normales.push(NR);
            normales.push(NR);

            triangles.push(F);
            triangles.push(O1);
            triangles.push(G);

            normales.push(NO1);
            normales.push(NO1);
            normales.push(NO1);

            triangles.push(H);
            triangles.push(O2);
            triangles.push(E);

            normales.push(NO2);
            normales.push(NO2);
            normales.push(NO2);
        }


        const indices = [];
        for (let i = 0; i < normales.length; i++) {
            indices.push(i);
        }

        const color = [0.2, 0.2, 1.0, 1.0];

        super(
            gl,
            triangles.flat(),
            normales.flat(),
            indices,
            (new Array(Math.ceil(triangles.length)))
                .fill(color, 0)
                .flat(),
        );
    }

}