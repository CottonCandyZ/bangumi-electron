{
  "targets": [
    {
      "target_name": "bangumi_macos_traffic_lights",
      "sources": [
        "src/traffic_light_spacing.mm"
      ],
      "conditions": [
        [
          "OS==\"mac\"",
          {
            "xcode_settings": {
              "CLANG_ENABLE_OBJC_ARC": "YES",
              "MACOSX_DEPLOYMENT_TARGET": "10.13",
              "OTHER_LDFLAGS": [
                "-framework",
                "AppKit"
              ]
            }
          }
        ]
      ]
    }
  ]
}
