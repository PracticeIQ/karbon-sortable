# Karbon-sortable

An addon for sortable items. Items within the list can be sorted via
dragging and dropping them into a new position. You can also identify
external drop targets for non-sorting actions.

## Features and Limitations

Drag and drop is implemented via HTML5, so it will not work in older
browsers or mobile. But for modern browsers it scales well even with
very long lists.

This addon has no styling to allow maximum customization. Instead, it
relies on setting and removing class names and firing events when certain
actions occur. The test app includes styling for demonstration that
you can use as a starting point.

##




## Installation

* `git clone` this repository
* `npm install`
* `bower install`

## Running

* `ember server`
* Visit your app at http://localhost:4200.

## Running Tests

* `npm test` (Runs `ember try:testall` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`

## Building

* `ember build`

## 
