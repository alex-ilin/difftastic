const PREC = {
  call: 14,
  field: 13,
  unary: 11,
  multiplicative: 10,
  additive: 9,
  shift: 8,
  bitand: 7,
  bitxor: 6,
  bitor: 5,
  comparative: 4,
  and: 3,
  or: 2,
  range: 1,
  assign: 0,
  closure: -1,
}

const numeric_type = choice(
  'u8',
  'i8',
  'u16',
  'i16',
  'u32',
  'i32',
  'u64',
  'i64',
  'isize',
  'usize',
  'f32',
  'f64'
)

module.exports = grammar({
  name: 'rust',

  extras: $ => [/\s/, $.line_comment, $.block_comment],

  inline: $ => [
    $._type_identifier,
    $._non_special_token,
    $._declaration_statement,
    $._expression_ending_with_block
  ],

  conflicts: $ => [
    [$.visibility_modifier]
  ],

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => choice(
      $.empty_statement,
      $.macro_definition,
      $._expression_statement,
      $._declaration_statement
    ),

    empty_statement: $ => ';',

    _expression_statement: $ => choice(
      seq($._expression, ';'),
      prec(1, $._expression_ending_with_block)
    ),

    _declaration_statement: $ => choice(
      $.const_item,
      $.attribute_item,
      $.inner_attribute_item,
      $.mod_item,
      $.struct_item,
      $.enum_item,
      $.type_item,
      $.function_item,
      $.function_signature_item,
      $.impl_item,
      $.trait_item,
      $.associated_type,
      $.let_declaration,
      $.use_declaration,
      $.extern_crate_declaration,
      $.static_item
    ),

    // Section - Macro definitions

    macro_definition: $ => {
      const rules = seq(
        repeat(seq($.macro_rule, ';')),
        optional($.macro_rule)
      )

      return seq(
        'macro_rules!',
        $.identifier,
        choice(
          seq('(', rules, ')', ';'),
          seq('{', rules, '}')
        )
      )
    },

    macro_rule: $ => seq(
      $.matcher,
      '=>',
      $.transcriber
    ),

    matcher: $ => choice(
      seq('(', repeat($._matcher), ')'),
      seq('[', repeat($._matcher), ']'),
      seq('{', repeat($._matcher), '}')
    ),

    _matcher: $ => choice(
      seq('(', repeat($._matcher), ')'),
      seq('[', repeat($._matcher), ']'),
      seq('{', repeat($._matcher), '}'),
      seq($.metavariable, ':', $.fragment_specifier),
      seq('$', '(', repeat($._matcher), ')', optional(/[^+*]+/), choice('+', '*')),
      $._non_special_token
    ),

    fragment_specifier: $ => choice(
      'ident', 'path', 'expr', 'ty', 'pat', 'stmt', 'block', 'item', 'meta', 'tt'
    ),

    transcriber: $ => choice(
      seq('(', repeat($._transcriber), ')'),
      seq('[', repeat($._transcriber), ']'),
      seq('{', repeat($._transcriber), '}')
    ),

    _transcriber: $ => prec.left(-1, choice(
      seq('(', repeat($._transcriber), ')'),
      seq('[', repeat($._transcriber), ']'),
      seq('{', repeat($._transcriber), '}'),
      seq('$', '(', repeat($._transcriber), ')', optional(/[^+*]+/), choice('+', '*')),
      $._non_special_token
    )),

    _non_special_token: $ => choice(
      $.identifier,
      $.metavariable,
      $._literal,
      '=>',
      'if',
      'for',
      'while',
      'let',
      'fn',
      '*',
      '+',
      '!',
      ',',
      ';'
    ),

    // Section - Declarations

    attribute_item: $ => seq(
      '#',
      '[',
      $.meta_item,
      ']'
    ),

    inner_attribute_item: $ => seq(
      '#',
      '!',
      '[',
      $.meta_item,
      ']'
    ),

    meta_item: $ => seq(
      $.identifier,
      optional(choice(
        seq('=', $._literal),
        seq('(', sepBy(',', $.meta_item), optional(','), ')')
      ))
    ),

    mod_item: $ => seq(
      optional($.visibility_modifier),
      'mod',
      $.identifier,
      choice(
        ';',
        $.declaration_list
      )
    ),

    declaration_list: $ => seq(
      '{',
      repeat($._declaration_statement),
      '}'
    ),

    struct_item: $ => seq(
      optional($.visibility_modifier),
      'struct',
      $._type_identifier,
      optional($.type_parameters),
      choice(
        $.field_declaration_list,
        seq($.ordered_field_declaration_list, ';'),
        ';'
      )
    ),

    enum_item: $ => seq(
      optional($.visibility_modifier),
      'enum',
      $._type_identifier,
      optional($.type_parameters),
      $.enum_variant_list
    ),

    enum_variant_list: $ => seq(
      '{',
      sepBy(',', $.enum_variant),
      optional(','),
      '}'
    ),

    enum_variant: $ => seq(
      optional($.visibility_modifier),
      $.identifier,
      optional(choice(
        $.field_declaration_list,
        $.ordered_field_declaration_list
      )),
      optional(seq(
        '=',
        $._expression
      ))
    ),

    field_declaration_list: $ => seq(
      '{',
      sepBy(',', $.field_declaration),
      optional(','),
      '}'
    ),

    field_declaration: $ => seq(
      optional($.visibility_modifier),
      $.identifier,
      ':',
      $._type
    ),

    ordered_field_declaration_list: $ => seq(
      '(',
      sepBy(',', seq(optional($.visibility_modifier), $._type)),
      optional(','),
      ')'
    ),

    extern_crate_declaration: $ => seq(
      'extern',
      'crate',
      choice(
        $.identifier,
        seq($.identifier, 'as', $.identifier)
      ),
      ';'
    ),

    const_item: $ => seq(
      optional($.visibility_modifier),
      'const',
      $.identifier,
      ':',
      $._type,
      '=',
      $._expression,
      ';'
    ),

    static_item: $ => seq(
      optional($.visibility_modifier),
      'static',
      $.identifier,
      ':',
      $._type,
      '=',
      $._expression,
      ';'
    ),

    type_item: $ => seq(
      optional($.visibility_modifier),
      'type',
      $._type_identifier,
      '=',
      $._type,
      ';'
    ),

    function_item: $ => seq(
      optional($.unsafe),
      optional($.visibility_modifier),
      optional($.extern_modifier),
      'fn',
      $.identifier,
      optional($.type_parameters),
      $.parameters,
      optional(choice(
        seq('->', $._type)),
        '!'
      ),
      optional($.where_clause),
      $.block
    ),

    function_signature_item: $ => seq(
      optional($.visibility_modifier),
      'fn',
      $.identifier,
      optional($.type_parameters),
      $.parameters,
      optional(choice(
        seq('->', $._type)),
        '!'
      ),
      ';'
    ),

    where_clause: $ => seq(
      'where',
      sepBy1(',', $.where_predicate)
    ),

    where_predicate: $ => seq(
      $._type_identifier,
      $.trait_bounds
    ),

    impl_item: $ => seq(
      optional($.unsafe),
      'impl',
      optional($.type_parameters),
      choice(
        $._type_identifier,
        $.scoped_type_identifier
      ),
      optional($.type_arguments),
      optional($.impl_for_clause),
      optional($.where_clause),
      $.declaration_list
    ),

    trait_item: $ => seq(
      optional($.visibility_modifier),
      'trait',
      $._type_identifier,
      optional($.type_parameters),
      optional($.trait_bounds),
      $.declaration_list
    ),

    associated_type: $ => seq(
      'type',
      $._type_identifier,
      optional($.trait_bounds),
      ';'
    ),

    trait_bounds: $ => seq(
      ':',
      sepBy1('+', choice($._type, $.lifetime, $.higher_ranked_trait_bound))
    ),

    higher_ranked_trait_bound: $ => seq(
      'for',
      $.type_parameters,
      $._type
    ),

    impl_for_clause: $ => seq(
      'for',
      choice(
        $._type_identifier,
        $.scoped_type_identifier
      ),
      optional($.type_arguments)
    ),

    type_parameters: $ => seq(
      '<',
      sepBy1(',', choice(
        $._type_identifier,
        $.constrained_type_parameter,
        $.optional_type_parameter,
        $.lifetime
      )),
      '>'
    ),

    constrained_type_parameter: $ => seq(
      $._type_identifier,
      ':',
      sepBy1('+', choice($._type, $.lifetime))
    ),

    optional_type_parameter: $ => seq(
      $._type_identifier,
      '=',
      $._type
    ),

    let_declaration: $ => seq(
      'let',
      optional($.mutable_specifier),
      $._pattern,
      optional(seq(
        ':',
        $._type
      )),
      optional(seq(
        '=',
        $._expression
      )),
      ';'
    ),

    use_declaration: $ => seq(
      optional($.visibility_modifier),
      'use',
      seq(
        repeat($.path),
        choice(
          choice(
            $.identifier,
            seq($.identifier, 'as', $.identifier)
          ),
          seq(
            '{',
            sepBy(',', choice(
              $.identifier,
              $.self,
              seq($.identifier, 'as', $.identifier)
            )),
            '}'
          ),
          '*'
        )
      ),
      ';'
    ),

    parameters: $ => seq(
      '(',
      sepBy(',', choice($.self_parameter, $.parameter, $._type)),
      ')'
    ),

    self_parameter: $ => seq(
      optional('&'),
      optional($.lifetime),
      optional($.mutable_specifier),
      $.self
    ),

    parameter: $ => seq(
      optional($.mutable_specifier),
      $.identifier,
      ':',
      $._type
    ),

    path: $ => seq(
      choice($.identifier, $.self),
      '::'
    ),

    extern_modifier: $ => seq(
      'extern',
      $.string_literal
    ),

    visibility_modifier: $ => seq(
      'pub',
      optional(seq(
        '(',
        optional('in'),
        choice(
          'crate',
          $.self,
          $.super
        ),
        ')'
      ))
    ),

    // Section - Types

    _type: $ => choice(
      $.reference_type,
      $.pointer_type,
      $.generic_type,
      $.scoped_type_identifier,
      $.tuple_type,
      $.unit_type,
      $.array_type,
      $.function_type,
      $._type_identifier,
      alias(choice(
        numeric_type,
        'bool',
        'str',
        'char'
      ), $.primitive_type)
    ),

    lifetime: $ => seq("'", $.identifier),

    array_type: $ => seq(
      '[',
      $._type,
      optional(seq(
        ';',
        $._expression
      )),
      ']'
    ),

    function_type: $ => seq(
      optional($.unsafe),
      optional($.extern_modifier),
      prec(PREC.call, seq(
        choice(
          $._type_identifier,
          $.scoped_identifier,
          'fn'
        ),
        $.parameters
      )),
      optional(seq(
        '->',
        $._type
      ))
    ),

    tuple_type: $ => seq(
      '(',
      sepBy1(',', $._type),
      ')'
    ),

    unit_type: $ => seq('(', ')'),

    generic_function: $ => seq(
      choice(
        $.identifier,
        $.scoped_identifier,
        $.field_expression
      ),
      '::',
      $.type_arguments
    ),

    generic_type: $ => prec(1, seq(
      choice(
        $._type_identifier,
        $.scoped_identifier
      ),
      $.type_arguments
    )),

    generic_type_with_turbofish: $ => seq(
      choice(
        $._type_identifier,
        $.scoped_identifier
      ),
      '::',
      $.type_arguments
    ),

    type_arguments: $ => seq(
      '<',
      sepBy1(',', choice(
        $._type,
        $.type_binding,
        $.lifetime
      )),
      '>'
    ),

    type_binding: $ => seq(
      $._type_identifier,
      '=',
      $._type
    ),

    reference_type: $ => seq(
      '&',
      optional($.lifetime),
      optional($.mutable_specifier),
      $._type
    ),

    pointer_type: $ => seq(
      '*',
      choice('const', $.mutable_specifier),
      $._type
    ),

    unsafe: $ => 'unsafe',

    mutable_specifier: $ => 'mut',

    // Section - Expressions

    _expression: $ => choice(
      $._no_struct_literal_expr,
      $.struct_expression
    ),

    _no_struct_literal_expr: $ => prec.left(choice(
      $.unary_expression,
      $.reference_expression,
      $.try_expression,
      $.binary_expression,
      $.range_expression,
      $.call_expression,
      $.return_expression,
      $._literal,
      $.identifier,
      $.self,
      $.scoped_identifier,
      $.generic_function,
      $.field_expression,
      $.array_expression,
      $.tuple_expression,
      $.macro_invocation,
      $.unit_expression,
      $._expression_ending_with_block,
      $.break_expression,
      $.continue_expression,
      $._index_expression,
      $.metavariable,
      $.closure_expression,
      seq('(', $._expression, ')')
    )),

    _expression_ending_with_block: $ => choice(
      $.unsafe_block,
      $.block,
      $.if_expression,
      $.if_let_expression,
      $.match_expression,
      $.while_expression,
      $.while_let_expression,
      $.loop_expression,
      $.for_expression
    ),

    macro_invocation: $ => seq(
      $.identifier,
      '!',
      $.macro_arguments
    ),

    macro_arguments: $ => {
      const args = choice(
        sepBy(',', $._expression),
        sepBy(';', $._expression)
      )

      return choice(
        seq('{', args, '}'),
        seq('(', args, ')'),
        seq('[', args, ']')
      )
    },

    scoped_identifier: $ => prec(-1, seq(
      optional(choice(
        $.self,
        $.identifier,
        $.scoped_identifier,
        alias($.generic_type_with_turbofish, $.generic_type)
      )),
      '::',
      $.identifier
    )),

    scoped_type_identifier_in_expression_position: $ => prec(-2, seq(
      optional(choice(
        $.self,
        $.identifier,
        $.scoped_identifier,
        alias($.generic_type_with_turbofish, $.generic_type)
      )),
      '::',
      $._type_identifier
    )),

    scoped_type_identifier: $ => seq(
      optional(choice(
        $.self,
        $.identifier,
        $.scoped_identifier,
        alias($.generic_type_with_turbofish, $.generic_type),
        $.generic_type
      )),
      '::',
      $._type_identifier
    ),

    range_expression: $ => prec.left(PREC.range, choice(
      seq($._expression, '..', $._expression),
      seq($._expression, '..'),
      seq('..', $._expression),
      '..'
    )),

    unary_expression: $ => prec(PREC.unary, seq(
      choice('-', '*', '!'),
      $._expression
    )),

    try_expression: $ => seq(
      $._expression,
      '?'
    ),

    reference_expression: $ => prec(PREC.unary, seq(
      '&',
      optional($.mutable_specifier),
      $._expression
    )),

    binary_expression: $ => choice(
      prec.left(PREC.multiplicative, seq($._expression, choice('*', '/', '%'), $._expression)),
      prec.left(PREC.additive, seq($._expression, choice('+', '-'), $._expression)),
      prec.left(PREC.comparative, seq($._expression,  choice('==', '!=', '<', '<=', '>', '>='), $._expression)),
      prec.left(PREC.shift, seq($._expression, choice('<<', '>>'), $._expression)),
      prec.left(PREC.and, seq($._expression, '&&', $._expression)),
      prec.left(PREC.or, seq($._expression, '||', $._expression)),
      prec.left(PREC.bitor, seq($._expression, '|', $._expression)),
      prec.left(PREC.bitand, seq($._expression, '&', $._expression)),
      prec.left(PREC.bitxor, seq($._expression, '^', $._expression)),
      $.assignment_expression,
      $.compound_assignment_expr,
      $.type_cast_expression
    ),

    assignment_expression: $ => prec.left(PREC.assign, seq($._expression, '=', $._expression)),

    compound_assignment_expr: $ => prec.left(PREC.assign, seq(
      $._expression,
      choice('+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>='),
      $._expression
    )),

    type_cast_expression: $ => seq(
      $._expression, 'as', $._type
    ),

    return_expression: $ => prec.left(seq(
      'return', optional($._expression))
    ),

    call_expression: $ => prec(PREC.call, seq(
      $._expression,
      $.arguments
    )),

    arguments: $ => seq(
      '(',
      sepBy(',', $._expression),
      ')'
    ),

    array_expression: $ => seq(
      '[',
      choice(
        seq($._expression, ';', $._expression),
        sepBy(',' ,$._expression)
      ),
      ']'
    ),

    tuple_expression: $ => seq(
      '(',
      seq($._expression, ','),
      repeat(seq($._expression, ',')),
      optional($._expression),
      ')'
    ),

    unit_expression: $ => '()',

    struct_expression: $ => seq(
      choice(
        $._type_identifier,
        alias($.scoped_type_identifier_in_expression_position, $.scoped_type_identifier)
      ),
      $.field_initializer_list
    ),

    field_initializer_list: $ => seq(
      '{',
      sepBy(',', choice(
        alias($.identifier, $.shorthand_field_identifier),
        $.field_initializer,
        $.base_field_initializer
      )),
      optional(','),
      '}'
    ),

    field_initializer: $ => seq($.identifier, ':', $._expression),

    base_field_initializer: $ => seq(
      '..',
      $._expression
    ),

    if_expression: $ => seq(
      'if',
      $._no_struct_literal_expr,
      $.block,
      optional($.else_tail)
    ),

    if_let_expression: $ => seq(
      'if',
      'let',
      $._pattern,
      '=',
      $._expression,
      $.block,
      optional($.else_tail)
    ),

    else_tail: $ => seq(
      'else',
      choice($.block, $.if_expression, $.if_let_expression)
    ),

    match_expression: $ => seq(
      'match',
      $._no_struct_literal_expr,
      '{',
      repeat($.match_arm),
      alias($.last_match_arm, $.match_arm),
      '}'
    ),

    match_arm: $ => seq(
      $.match_pattern,
      '=>',
      choice(
        seq($._expression, ','),
        prec(1, $._expression_ending_with_block)
      )
    ),

    last_match_arm: $ => seq(
      $.match_pattern,
      '=>',
      $._expression,
      optional(',')
    ),

    match_pattern: $ => seq(
      $._pattern,
      repeat(seq('|', $._pattern)),
      optional(seq('if', $._no_struct_literal_expr))
    ),

    while_expression: $ => seq(
      optional(seq($.loop_label, ':')),
      'while',
      $._no_struct_literal_expr,
      $.block
    ),

    while_let_expression: $ => seq(
      optional(seq($.loop_label, ':')),
      'while',
      'let',
      $._pattern,
      '=',
      $._no_struct_literal_expr,
      $.block
    ),

    loop_expression: $ => seq(
      optional(seq($.loop_label, ':')),
      'loop',
      $.block
    ),

    for_expression: $ => seq(
      optional(seq($.loop_label, ':')),
      'for',
      $._pattern,
      'in',
      $._no_struct_literal_expr,
      $.block
    ),

    closure_expression: $ => prec(PREC.closure, seq(
      $.closure_parameters,
      choice($.block, $._expression)
    )),

    closure_parameters: $ => seq(
      '|',
      sepBy(',', choice($.closure_parameter, $.parameter)),
      '|'
    ),

    closure_parameter: $ => seq(
      optional($.mutable_specifier),
      $._pattern
    ),

    loop_label: $ => seq('\'', $.identifier),

    break_expression: $ => prec.left(seq('break', optional($.loop_label))),

    continue_expression: $ => prec.left(seq('continue', optional($.loop_label))),

    _index_expression: $ => prec(PREC.call, seq($._expression, '[', $._expression, ']')),

    field_expression: $ => prec(PREC.field, seq(
      $._expression,
      '.',
      choice($.identifier, alias($._integer_literal, $.number_literal))
    )),

    unsafe_block: $ => seq(
      $.unsafe,
      $.block
    ),

    block: $ => seq(
      '{',
      repeat($._statement),
      optional($._expression),
      '}'
    ),

    // Section - Patterns

    _pattern: $ => choice(
      $._literal,
      $.identifier,
      $.scoped_identifier,
      $.tuple_pattern,
      $.tuple_struct_pattern,
      $.struct_pattern,
      $.ref_pattern,
      $.reference_pattern,
      $.remaining_field_pattern,
      '_'
    ),

    tuple_pattern: $ => seq(
      '(',
      sepBy(',', $._pattern),
      ')'
    ),

    tuple_struct_pattern: $ => seq(
      choice(
        $.identifier,
        $.scoped_identifier
      ),
      '(',
      sepBy(',', $._pattern),
      ')'
    ),

    struct_pattern: $ => seq(
      choice(
        $.identifier,
        $.scoped_identifier
      ),
      '{',
      sepBy(',', choice($.field_pattern, $.remaining_field_pattern)),
      '}'
    ),

    field_pattern: $ => seq(
      optional('ref'),
      optional($.mutable_specifier),
      choice(
        alias($.identifier, $.shorthand_field_identifier),
        seq($.identifier, ':', $._pattern)
      )
    ),

    remaining_field_pattern: $ => '..',

    ref_pattern: $ => seq(
      'ref',
      optional($.mutable_specifier),
      $._pattern
    ),

    reference_pattern: $ => seq(
      '&',
      optional($.mutable_specifier),
      $._pattern
    ),

    // Section - Literals

    _literal: $ => choice(
      $.string_literal,
      $.raw_string_literal,
      $.char_literal,
      $.boolean_literal,
      $.number_literal
    ),

    number_literal: $ => {
      const exponent = token(seq(
        choice('e', 'E'),
        optional(choice('+', '-')),
        repeat(choice(/[0-9]/, '_'))
      ))

      return prec.right(seq(
        $._integer_literal,
        optional(choice(
          exponent,
          seq(
            '.',
            optional(/[0-9_]+/),
            optional(exponent)
          )
        )),
        optional(numeric_type)
      ))
    },

    _integer_literal: $ => token(choice(
      seq(/[0-9]/, repeat(choice(/[0-9]/, '_'))),
      seq('0x', repeat(choice(/[0-9a-fA-F]/, '_'))),
      seq('0b', repeat(choice(/[01]/, '_'))),
      seq('0o', repeat(choice(/[0-7]/, '_')))
    )),

    string_literal: $ => token(seq(
      '"',
      repeat(choice(
        seq('\\', choice(/./, '\n', /x[0-9a-fA-F][0-9a-fA-F]/)),
        /[^\\"]/
      )),
      '"'
    )),

    raw_string_literal: $ => token(choice(
      seq('r#"', repeat(/.*/), '"#'),
      seq('r##"', repeat(/.*/), '"##'),
      seq('r###"', repeat(/.*/), '"###')
    )),

    char_literal: $ => token(seq(
      optional('b'),
      '\'',
      optional(choice(
        seq('\\', choice(/./, '\n', /x[0-9a-fA-F][0-9a-fA-F]/)),
        /[^\\']/
      )),
      '\''
    )),

    boolean_literal: $ => choice('true', 'false'),

    comment: $ => choice(
      $.line_comment,
      $.block_comment
    ),

    line_comment: $ => token(seq(
      '//', /.*/
    )),

    // Regex to match a C-style multiline comment
    // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    block_comment: $ => token(seq(
      '/*',
      /[^*]*\*+([^/*][^*]*\*+)*/,
      '/'
    )),

    identifier: $ => /[a-zA-Z_][\w]*/,

    _type_identifier: $ => alias($.identifier, $.type_identifier),

    self: $ => 'self',

    super: $ => 'super',

    metavariable: $ => /\$[a-zA-Z_]\w*/
  }
})

function sepBy1(sep, rule) {
  return seq(rule, repeat(seq(sep, rule)))
}

function sepBy(sep, rule) {
  return optional(sepBy1(sep, rule))
}
