#import <Cocoa/Cocoa.h>
#include <node_api.h>

#include <algorithm>
#include <cstring>

namespace {

napi_value Boolean(napi_env env, bool value) {
  napi_value result;
  napi_get_boolean(env, value, &result);
  return result;
}

bool ReadPointerFromBuffer(napi_env env, napi_value value, void **pointer) {
  bool is_buffer = false;
  napi_status status = napi_is_buffer(env, value, &is_buffer);
  if (status != napi_ok || !is_buffer) return false;

  void *data = nullptr;
  size_t length = 0;
  status = napi_get_buffer_info(env, value, &data, &length);
  if (status != napi_ok || data == nullptr || length < sizeof(void *)) return false;

  std::memcpy(pointer, data, sizeof(void *));
  return *pointer != nullptr;
}

napi_value SetTrafficLightSpacing(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value args[2];
  napi_status status = napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  if (status != napi_ok || argc < 2) return Boolean(env, false);

  void *native_view_pointer = nullptr;
  if (!ReadPointerFromBuffer(env, args[0], &native_view_pointer)) return Boolean(env, false);

  double gap_value = 3.0;
  status = napi_get_value_double(env, args[1], &gap_value);
  if (status != napi_ok) return Boolean(env, false);

  const CGFloat gap = static_cast<CGFloat>(std::clamp(gap_value, -2.0, 20.0));

  @autoreleasepool {
    NSView *native_view = (__bridge NSView *)native_view_pointer;
    NSWindow *window = [native_view window];
    if (window == nil) return Boolean(env, false);

    NSButton *close_button = [window standardWindowButton:NSWindowCloseButton];
    NSButton *minimize_button = [window standardWindowButton:NSWindowMiniaturizeButton];
    NSButton *zoom_button = [window standardWindowButton:NSWindowZoomButton];
    if (close_button == nil || minimize_button == nil || zoom_button == nil) {
      return Boolean(env, false);
    }

    NSRect close_frame = [close_button frame];
    NSRect minimize_frame = [minimize_button frame];
    NSRect zoom_frame = [zoom_button frame];

    minimize_frame.origin.x = close_frame.origin.x + close_frame.size.width + gap;
    minimize_frame.origin.y = close_frame.origin.y;
    zoom_frame.origin.x = minimize_frame.origin.x + minimize_frame.size.width + gap;
    zoom_frame.origin.y = close_frame.origin.y;

    [minimize_button setFrame:minimize_frame];
    [zoom_button setFrame:zoom_frame];
    [[close_button superview] setNeedsLayout:YES];
    [[close_button superview] setNeedsDisplay:YES];

    return Boolean(env, true);
  }
}

napi_value Init(napi_env env, napi_value exports) {
  napi_property_descriptor descriptors[] = {
      {"setTrafficLightSpacing", nullptr, SetTrafficLightSpacing, nullptr, nullptr, nullptr, napi_default, nullptr},
  };
  napi_define_properties(env, exports, 1, descriptors);
  return exports;
}

}  // namespace

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
