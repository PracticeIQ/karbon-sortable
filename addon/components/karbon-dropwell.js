import Ember from 'ember';
import layout from '../templates/components/karbon-dropwell';


export default Ember.Component.extend({
  classNames: ['dropwell'],
  classNameBindings: ['dragover'],
  dragover: false,
  disable: Ember.computed('selected', function() {
    const selected = this.get('selected');

    return selected === this.get('data');
  }),

  didInsertElement() {
    this.$().on('dragenter.karbondropwell', (event) => {
      if (!this.get('disable')) {
        this.set('dragover', true);
      }
    });

    this.$().on('dragover.karbondropwell', (event) => {
      if (!this.get('disable')) {
        event.preventDefault();

        this.set('dragover', true);
      }
    });

    this.$().on('dragleave.karbondropwell', (event) => {
      if (!this.get('disable')) {
        this.set('dragover', false);
      }
    });

    this.$().on('drop.karbondropwell', (event) => {
      if (!this.get('disable')) {
        this.set('dragover', false);

        const dropWellId = this.get('data');
        const droppedItemId = event.dataTransfer.getData('text');

        this.get('onDropOnWell')(dropWellId, droppedItemId);
      }
    });
  },

  willDestroyElement() {
    this.$().off('dragenter.karbondropwell');
    this.$().off('dragover.karbondropwell');
    this.$().off('dragleave.karbondropwell');
    this.$().off('drop.karbondropwell');
  }
});
