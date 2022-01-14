pub fn replace(
  // <- keyword
  // <- keyword
  //   ^ function
  //          ^ punctuation.bracket
  in original: String,
  // <- property
  // ^ variable.parameter
  //            ^ type
  //                 ^ punctuation.delimeter
  each pattern: String,
  // <- property
  //   ^ variable.parameter
  //             ^ type
  //                  ^ punctuation.delimeter
  with replacement: String,
  // <- property
  //   ^ variable.parameter
  //                ^ type
  //                      ^ punctuation.delimeter
) -> String {
  // <- punctuation.delimeter
  // ^ type
  //        ^ punctuation.bracket
  string.replace(in: original, each: pattern, with: replacement)
  // <- module
  //        ^ function
  //              ^ property
  //                  ^ variable.parameter
  //                            ^ property
  //                                  ^ variable.parameter
  //                                           ^ property
  //                                                 ^ variable.parameter
  original
  // ^ variable.parameter
  |> string.replace(pattern, replacement)
  // ^ module
  //        ^ function
  //                ^ variable.parameter
  //                         ^ variable.parameter
}

fn trial(uri) {
  case uri {
    Uri(scheme: None) -> True
    // <- type
    //  ^ property
    //          ^ type
    //                   ^ type
    _ -> False
  }
}
