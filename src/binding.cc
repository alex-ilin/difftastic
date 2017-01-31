#include "tree_sitter/parser.h"
#include <node.h>
#include "nan.h"

using namespace v8;

extern "C" TSLanguage * tree_sitter_ruby();

namespace {

NAN_METHOD(New) {}

void Init(Handle<Object> exports, Handle<Object> module) {
  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);
  tpl->SetClassName(Nan::New("Language").ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Local<Function> constructor = tpl->GetFunction();
  Local<Object> instance = constructor->NewInstance(Nan::GetCurrentContext()).ToLocalChecked();
  Nan::SetInternalFieldPointer(instance, 0, tree_sitter_ruby());

  instance->Set(Nan::New("name").ToLocalChecked(), Nan::New("ruby").ToLocalChecked());
  module->Set(Nan::New("exports").ToLocalChecked(), instance);
}

NODE_MODULE(ts_language_ruby_binding, Init)

}  // namespace
