import Ember from 'ember';
import layout from '../templates/components/karbon-dropwell';


export default Ember.Component.extend({
  classNames: ['dropwell'],
  classNameBindings: ['dragover'],
  dragover: false,

  didInsertElement() {
    this.$().on('dragenter.karbondropwell', (event) => {
      this.set('dragover', true);
    });

    this.$().on('dragover.karbondropwell', (event) => {
      event.preventDefault();
    });

    this.$().on('dragleave.karbondropwell', (event) => {
      this.set('dragover', false);
    });

    this.$().on('drop.karbondropwell', (event) => {
      this.set('dragover', false);

      const dropWellId = this.get('data');
      const droppedItemId = event.dataTransfer.getData('text');

      this.get('onDropOnWell')(dropWellId, droppedItemId);
    });
  },

  willDestroyElement() {
    this.$().off('dragenter.karbondropwell');
    this.$().off('dragover.karbondropwell');
    this.$().off('dragleave.karbondropwell');
    this.$().off('drop.karbondropwell');
  }
});
