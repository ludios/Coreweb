#!/bin/sh -e

haxe -cp hx -v -swf-version 9 -swf \
./cwtools/exp/Experiments.swf \
-main cw.exp.Experiments \
> ./cwtools/exp/Experiments.swf.log

haxe -cp hx -v -swf-version 9 -swf \
./cwtools/testres/TestExternalInterface.swf \
-main cw.TestExternalInterface \
> ./cwtools/testres/TestExternalInterface.swf.log

haxe -cp hx -v -swf-version 9 -swf \
./cwtools/exp/cw_json_tests.swf \
-resource ./hx/cw/json/pass1_modified.json@pass1_modified \
-swf-header 800:600:1:F7F7F7 \
-main cw.json.Tests \
> ./cwtools/exp/cw_json_tests.swf.log
