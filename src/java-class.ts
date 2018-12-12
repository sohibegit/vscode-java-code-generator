import { Decleration } from './decleration';
import { lowerCaseFirstLetter } from './functions';

export interface IJavaClass {
    name: string;
    declerations: Decleration[];
    methodNames: string[];
    hasEmptyConstructor: boolean;
    hasNoneEmptyConstructor: boolean;
}

export class JavaClass implements IJavaClass {
    constructor(
        public name: string,
        public declerations: Decleration[],
        public methodNames: string[],
        public hasEmptyConstructor: boolean,
        public hasNoneEmptyConstructor: boolean
    ) {}
    nameLowerCase(): string {
        return lowerCaseFirstLetter(this.name);
    }
}
