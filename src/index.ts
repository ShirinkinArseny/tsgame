import {doLogic, prepareLogic} from "./logic/logic";
import {doRender, prepareRender} from "./render/render";

Promise.all([
    prepareLogic(),
    prepareRender()
]).then(() => {
    const frame = () => {
        doLogic();
        doRender();
        requestAnimationFrame(frame);
    }

    frame();
})



