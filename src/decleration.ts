export interface IDecleration {
    variableType?: string;
    variableName?: string;
    variableNameFirstCapital?: string;
}

export class Decleration implements IDecleration {
    constructor(public variableType?: string, public variableName?: string, public variableNameFirstCapital?: string) { }
}
