#!/usr/bin/env ruby
require 'xcodeproj'
require 'pathname'

project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.find { |item| item.name == 'App' }
raise 'Capacitor App target missing' unless target

# Xcode project is rooted in ios/App; group App refers to ios/App/App.
group = project.main_group.find_subpath('App', true)
group.path = 'App' if group.path.nil? || group.path.empty?
group.source_tree = '<group>'
%w[MawaeidiAlarmPlugin.swift MawaeidiBridgeViewController.swift].each do |filename|
  ref = group.files.find { |item| item.path == filename } || group.new_file(filename)
  unless target.source_build_phase.files_references.include?(ref)
    target.source_build_phase.add_file_reference(ref)
  end
  raise "Missing Swift source: #{ref.real_path}" unless File.file?(ref.real_path)
end

target.build_configurations.each do |config|
  config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'
  config.build_settings['TARGETED_DEVICE_FAMILY'] = '1,2'
  config.build_settings['SWIFT_VERSION'] = '5.0'
end
project.save
puts "Registered the MawaeidiAlarm Swift plugin and view controller with the App target."
