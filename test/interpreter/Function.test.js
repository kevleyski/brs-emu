const BrsError = require("../../lib/Error");
const Expr = require("../../lib/parser/Expression");
const Stmt = require("../../lib/parser/Statement");
const { identifier, token } = require("../parser/ParserTests");
const { binary } = require("./InterpreterTests");
const { Lexeme } = require("../../lib/Lexeme");
const { Interpreter } = require("../../lib/interpreter");
const { Int32, BrsString, BrsBoolean, BrsInvalid, Callable, ValueKind } = require("../../lib/brsTypes");

let interpreter;

describe("interpreter function declarations", () => {
    beforeEach(() => {
        BrsError.reset();

        interpreter = new Interpreter();
    });

    it("creates function callables", () => {
        let statements = [
            new Stmt.Function(
                { kind: Lexeme.Identifier, text: "foo", line: 1 },
                [],
                new Stmt.Block([])
            )
        ];

        interpreter.exec(statements);
        expect(BrsError.found()).toBe(false);

        let storedValue = interpreter.environment.get(
            { kind: Lexeme.Identifier, text: "foo", line: 3 }
        );
        expect(storedValue).not.toBe(BrsInvalid.Instance);
        expect(storedValue).toBeInstanceOf(Callable);
    });

    it("can call functions after definition", () => {
        let emptyBlock = new Stmt.Block([]);
        jest.spyOn(emptyBlock, "accept");

        let statements = [
            new Stmt.Function(
                { kind: Lexeme.Identifier, text: "foo", line: 1 },
                [],
                ValueKind.Void,
                emptyBlock
            ),
            new Stmt.Expression(
                new Expr.Call(
                    new Expr.Variable(
                        { kind: Lexeme.Identifier, text: "foo", line: 3 }
                    ),
                    { kind: Lexeme.RightParen, text: ")", line: 3 },
                    []
                )
            )
        ];

        interpreter.exec(statements);
        expect(BrsError.found()).toBe(false);

        expect(emptyBlock.accept).toHaveBeenCalledTimes(1);
    });

    it("returns values", () => {
        let statements = [
            new Stmt.Function(
                { kind: Lexeme.Identifier, text: "foo", line: 1 },
                [],
                ValueKind.String,
                new Stmt.Block([
                    new Stmt.Return(
                        { kind: Lexeme.Return, text: "return", line: 2 },
                        new Expr.Literal(
                            new BrsString("hello, world")
                        )
                    )
                ])
            ),
            new Stmt.Assignment(
                { kind: Lexeme.Identifier, text: "result", line: 4},
                new Expr.Call(
                    new Expr.Variable(
                        { kind: Lexeme.Identifier, text: "foo", line: 4 }
                    ),
                    { kind: Lexeme.RightParen, text: ")", line: 4 },
                    []
                )
            )
        ];

        interpreter.exec(statements);
        expect(BrsError.found()).toBe(false);

        let storedResult = interpreter.environment.get(
            { kind: Lexeme.Identifier, text: "result", line: 5 }
        );
        expect(storedResult).toEqual(new BrsString("hello, world"));
    });

    it("evaluates default arguments", () => {
        let statements = [
            new Stmt.Function(
                { kind: Lexeme.Identifier, text: "ident", line: 1 },
                [{
                    name: "input",
                    type: ValueKind.Int32,
                    defaultValue: new Expr.Literal(new Int32(-32))
                }],
                ValueKind.Int32,
                new Stmt.Block([
                    new Stmt.Return(
                        { kind: Lexeme.Return, text: "return", line: 2 },
                        new Expr.Variable(
                            { kind: Lexeme.Identifier, text: "input", line: 2 }
                        )
                    )
                ])
            ),
            new Stmt.Assignment(
                { kind: Lexeme.Identifier, text: "result", line: 4 },
                new Expr.Call(
                    new Expr.Variable(
                        { kind: Lexeme.Identifier, text: "ident", line: 4 }
                    ),
                    { kind: Lexeme.RightParen, text: ")", line: 4 },
                    []
                )
            )
        ];

        interpreter.exec(statements);
        expect(BrsError.found()).toBe(false);

        let storedResult = interpreter.environment.get(
            { kind: Lexeme.Identifier, text: "result", line: 5 }
        );
        expect(storedResult).toEqual(new Int32(-32));

        expect(interpreter.environment.has(
            { kind: Lexeme.Identifier, text: "input", line: 6 }
        )).toBe(false);
    });

    it("enforces return value type checking", () => {
        let statements = [
            new Stmt.Function(
                { kind: Lexeme.Identifier, text: "foo", line: 1 },
                [],
                ValueKind.Int32,
                new Stmt.Block([
                    new Stmt.Return(
                        { kind: Lexeme.Return, text: "return", line: 2 },
                        new Expr.Literal(
                            new BrsString("not a number")
                        )
                    )
                ])
            ),
            new Stmt.Assignment(
                { kind: Lexeme.Identifier, text: "result", line: 4},
                new Expr.Call(
                    new Expr.Variable(
                        { kind: Lexeme.Identifier, text: "foo", line: 4 }
                    ),
                    { kind: Lexeme.RightParen, text: ")", line: 4 },
                    []
                )
            )
        ];

        expect(() => interpreter.exec(statements)).toThrow("Attempting to return value of type");
        expect(BrsError.found()).toBe(true);
    });

    it("evaluates default arguments", () => {
        let statements = [
            new Stmt.Function(
                { kind: Lexeme.Identifier, text: "ident", line: 1 },
                [{
                    name: "input",
                    type: ValueKind.Int32,
                    defaultValue: new Expr.Literal(new Int32(-32))
                }],
                ValueKind.Int32,
                new Stmt.Block([
                    new Stmt.Return(
                        { kind: Lexeme.Return, text: "return", line: 2 },
                        new Expr.Variable(
                            { kind: Lexeme.Identifier, text: "input", line: 2 }
                        )
                    )
                ])
            ),
            new Stmt.Assignment(
                { kind: Lexeme.Identifier, text: "result", line: 4 },
                new Expr.Call(
                    new Expr.Variable(
                        { kind: Lexeme.Identifier, text: "ident", line: 4 }
                    ),
                    { kind: Lexeme.RightParen, text: ")", line: 4 },
                    []
                )
            )
        ];

        interpreter.exec(statements);
        expect(BrsError.found()).toBe(false);

        let storedResult = interpreter.environment.get(
            { kind: Lexeme.Identifier, text: "result", line: 5 }
        );
        expect(storedResult).toEqual(new Int32(-32));

        expect(interpreter.environment.has(
            { kind: Lexeme.Identifier, text: "input", line: 6 }
        )).toBe(false);
    });
});