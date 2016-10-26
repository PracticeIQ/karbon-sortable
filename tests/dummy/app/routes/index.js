import Ember from 'ember';

// Simple models
const items = [
    'apple',
    'pear',
    'mango',
    'lemon',
    'orange',
    'dwarf',
    'gnome',
    'troll',
    'weasel',
    'farret',
    'doorknob',
    'bamboo',
    'sentinel',
    'candle',
    'martini',
    'boxcar',
    'pegasus',
    'zirconium',
    'knoxberry',
    'tensor',
    'carbon'
];

export default Ember.Route.extend({
  model: function() {
    return items;
  }
});

