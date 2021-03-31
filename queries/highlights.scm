["when" "and" "or" "not in" "not" "in" "fn" "do" "end" "catch" "rescue" "after" "else"] @keyword

[(true) (false) (nil)] @constant.builtin

(keyword) @tag
(atom) @tag

(comment) @comment

(escape_sequence) @escape

(call (identifier) @keyword
      (#match? @keyword "^(defmodule|defexception|defp|def|with|case|cond|raise|import|require|use|defmacro|defguard|defstruct|alias|defimpl|defprotocol|receive|if|for)$"))

(call (identifier) @keyword
      [(qualified_call
        name: (identifier) @function
        (arguments
         [(identifier) @variable.parameter
          (_ !function !object !name (identifier) @variable.parameter)
          (_ !function !object !name (_ !function !object !name (identifier) @variable.parameter))
          (_ !function !object !name (_ !function !object !name (_ !function !object !name (identifier) @variable.parameter)))
          (_ !function !object !name (_ !function !object !name (_ !function !object !name (_ !function !object !name (identifier) @variable.parameter))))
          (_ !function !object !name (_ !function !object !name (_ !function !object !name (_ !function !object !name (_ !function !object !name (identifier) @variable.parameter)))))]))
       (identifier) @function
       (binary_op
        left:
        [(qualified_call
          name: (identifier) @function
          (arguments
           [(identifier) @variable.parameter
            (_ !function !object !name (identifier) @variable.parameter)
            (_ !function !object !name (_ !function !object !name (identifier) @variable.parameter))
            (_ !function !object !name (_ !function !object !name (_ !function !object !name (identifier) @variable.parameter)))
            (_ !function !object !name (_ !function !object !name (_ !function !object !name (_ !function !object !name (identifier) @variable.parameter))))
            (_ !function !object !name (_ !function !object !name (_ !function !object !name (_ !function !object !name (_ !function !object !name (identifier) @variable.parameter)))))]))
         (identifier) @function]
        operator: "when")
       (binary_op
        left: (identifier) @variable.parameter
        operator: _ @function
        right: (identifier) @variable.parameter)]
      (#match? @keyword "^(defp|def|defmacro|defguard|defdelegate)$"))

(anonymous_function
 (stab_expression
  left: (bare_arguments
         [(identifier) @variable.parameter
          (_ !function !object !name (identifier) @variable.parameter)
          (_ !function !object !name (_ !function !object !name (identifier) @variable.parameter))
          (_ !function !object !name (_ !function !object !name (_ !function !object !name (identifier) @variable.parameter)))
          (_ !function !object !name (_ !function !object !name (_ !function !object !name (_ !function !object !name (identifier) @variable.parameter))))
          (_ !function !object !name (_ !function !object !name (_ !function !object !name (_ !function !object !name (_ !function !object !name (identifier) @variable.parameter)))))]))
 (#match? @variable.parameter "^[^_]"))

(unary_op
 operator: "@"
 (call (identifier) @attribute
       (heredoc
        [(heredoc_start)
         (heredoc_content)
         (heredoc_end)] @doc))
 (#match? @attribute "^(doc|moduledoc)$"))

(module) @type

(unary_op
 operator: "@" @attribute
 [(call
   name: (identifier) @attribute)
  (identifier) @attribute])

(unary_op
 operator: _ @operator)

(binary_op
 operator: _ @operator)

(string_start) @string
(string_content) @string
(string_end) @string

(sigil_start) @string.special
(sigil_content) @string
(sigil_end) @string.special

(interpolation
 "#{" @punctuation.special
 "}" @punctuation.special)

[
 ","
 "->"
 "."
] @punctuation.delimiter

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
  "<<"
  ">>"
] @punctuation.bracket

[(identifier) @function.special
 (#match? @function.special "^__.+__$")]

[(identifier) @comment
 (#match? @comment "^_")]

(ERROR) @warning
