import { capitalizeFirstLetter } from './functions';
export interface IDecleration {
    variableType: string;
    variableName: string;
    isFinal: boolean;
    isFinalValueAlradySet: boolean;
}

export class Decleration implements IDecleration {
    constructor(public variableType: string, public variableName: string, public isFinal: boolean, public isFinalValueAlradySet: boolean) {}

    isPrimitive(): boolean {
        return ['byte', 'short', 'int', 'long', 'float', 'double', 'char', 'boolean'].indexOf(this.variableType) !== -1;
    }

    isBoolean(): boolean {
        return 'boolean' === this.variableType.toLowerCase();
    }

    variableNameFirstCapital(): string {
        return capitalizeFirstLetter(this.variableName);
    }
}
