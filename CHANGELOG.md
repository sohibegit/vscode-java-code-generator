# Change Log

## [5.3.0] - 2020-02-15

### Added

-   Settings property to include`@Generated("sohibe.vscode")` annotation with the generated code.`

## [5.2.0] - 2020-02-15

### Added

-   Settings property to copy `@JsonProperty` annotation from variables to Setters and Getters.`

## [4.2.0] - 2019-04-22

### Added

-   Settings property to use id only with `hashCode()` and `equals()`
-   Settings property to use String, Primitive and Primitive Wrappers only for `toString()`

## [4.1.0] - 2019-02-11

### Added

-   Support for multiple variables same line `private String firstName,lastName;`

## [4.0.0] - 2018-12-12

### Added

-   Generator GUI
-   Generate all "Quick"
-   toString() without Getters()
-   No need to highlight properties
-   Determine existing code "prevents duplicate"

## [3.3.0] - 2018-10-08

### Added

-   Generate All
-   Option to put the method's opening brace on a new line instead of the same line "java.code.generators.methodOpeningBraceOnNewLine"

### Fixed

-   selecting any variable marked as protected result in 'undefined'

## [3.2.2] - 2018-09-04

### Added

-   add setting to include Fluent Setters with Java: Generate Setters and Getters

## [3.2.1] - 2018-08-29

### Added

-   add support for multiple classes,enums and interfaces in the same file

## [3.2.0] - 2018-08-29

### Added

-   Generate Getters (only)

## [3.1.0] - 2018-08-13

### Added

-   Generate Fluent Setters

## [3.0.0] - 2018-08-04

### Added

-   generate Equals And HashCode

## [2.1.1] - 2018-07-24

-   tweaks

## [2.1.0] - 2018-07-24

### Added

-   generate Constructor
-   generate Constructor Using Fields

## [2.0.1] - 2018-07-24

### Fixed

-   declarations with assignment

## [2.0.0] - 2018-07-22

### Added

-   generate toString()

### Fixed

-   Newline missing in some scenarios
-   ignoring @Annotations
-   ignoring one line comments

## [1.0.0] - 2018-05-12

### Added

-   generate Setters and Getters
