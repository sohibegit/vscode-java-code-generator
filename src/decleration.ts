export interface IDecleration {
    variableType?: string;
    variableName?: string;
    variableNameFirstCapital?: string;
}

export class Decleration implements IDecleration {
    constructor(
        public variableType?: string,
        public variableName?: string,
        public variableNameFirstCapital?: string
    ) { }

    isPrimitive(): boolean {
        if (!this.variableType) { return false; }
        return ['byte',
            'short',
            'int',
            'long',
            'float',
            'double',
            'char',
            'boolean'].indexOf(this.variableType) !== -1;
    }
}
