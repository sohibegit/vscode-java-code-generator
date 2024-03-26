# Change Log

## [8.0.1] - 2024-03-26

### Added

-   Renamed app from "**Java Code Generators**" to "**Code Generator For Java**" for copyright reasons.
-   Updated icon for copyright compliance.

## [7.4.0] - 2021-09-04

### Added

-   added new Generate SerialVersionUID
-   auto import java.util.Objects when generating equals

### Fixed

-   multiple issues when generating a Class with only static fields

## [7.4.0] - 2021-09-04

### Added

-   added new Beta or Experimental menu that includes

        Generate Lombok @RequiredArgsConstructor and @Slf4j
        Generate Lombok @Data @Accessors @EqualsAndHashCode
        Generate Lombok @Slf4j

## [7.3.0] - 2021-09-04

### Added

-   added new option to Generate Logger Debug of any selected text like `log.debug("selectedText: {}", selectedText);`

## [7.0.1] - 2021-01-08

### Fixed

-   multiple errors using the GUI without closing it

## [7.0.0] - 2021-01-08

### Added

-   added new Submenu contains all the available commands.
-   Settings property to let Fluent Setters calls normal Setters and it's true by default.

### Fixed

-   some tweaks and fixs

## [5.3.0] - 2020-02-15

### Added

-   Settings property to include`@Generated("sohibe.vscode")` annotation with the generated code.

## [5.2.0] - 2020-02-15

### Added

-   Settings property to copy `@JsonProperty` annotation from variables to Setters and Getters.

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
