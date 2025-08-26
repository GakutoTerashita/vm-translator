import { translateVmToAsm } from "./modules/vm-translator";

translateVmToAsm().catch(e => {
    console.error('Error during translation:', e);
});