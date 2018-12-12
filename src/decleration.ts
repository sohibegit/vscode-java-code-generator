import { capitalizeFirstLetter } from './functions';
export interface IDecleration {
    variableType: string;
    variableName: string;
    isFinal: boolean;
}

export class Decleration implements IDecleration {
    constructor(public variableType: string, public variableName: string, public isFinal: boolean) {}

    isPrimitive(): boolean {
        if (!this.variableType) {
            return false;
        }
        return ['byte', 'short', 'int', 'long', 'float', 'double', 'char', 'boolean'].indexOf(this.variableType) !== -1;
    }

    variableNameFirstCapital(): string {
        return capitalizeFirstLetter(this.variableName);
    }
}
