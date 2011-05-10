#!/bin/sh -e

../closure-library/closure/bin/build/closurebuilder.py \
--output_mode=compiled \
--compiler_jar=../closure-compiler/build/compiler.jar \
--compiler_flags="--compilation_level=ADVANCED_OPTIMIZATIONS" \
--compiler_flags="--warning_level=VERBOSE" \
--compiler_flags="--formatting=PRETTY_PRINT" \
--compiler_flags="--jscomp_warning=missingProperties" \
--compiler_flags="--jscomp_warning=undefinedVars" \
--compiler_flags="--jscomp_warning=checkTypes" \
--compiler_flags="--output_wrapper=(function() { %output%})();" \
--root=../closure-library \
--namespace="cw.tabnexus_worker" \
--root=js_coreweb \
--output_file=cwtools/compiled/tabnexus_worker.js \
