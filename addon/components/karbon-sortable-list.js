import Ember from 'ember';
import layout from '../templates/components/karbon-sortable-list';

/**
 * A container for sortable items. Items within the list can be sorted via
 * dragging and dropping them into a new position. You can also identify
 * external drop targets for non-sorting actions.
 */


export default Ember.Component.extend({
  tagName: 'ul',
  classNames: ['karbon-sortable-list'],
  classNameBindings: ['containerClass'],

  layout,

  // The DOM element being dragged
  draggedEl: null,

  didInsertElement() {
    this.$().on('dragstart.karbonsortable', (event) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.dropEffect = 'move';

      this.set('draggedEl', event.target);
      event.target.classList.add('dragging');
    });

    this.$().on('dragend.karbonsortable', (event) => {
      if (event.dataTransfer.dropEffect) {
          event.target.classList.add('dropping');
          Ember.run.later( () => {
              event.target.classList.remove('dragging');
              event.target.classList.remove('dropping');
          }, 1000);
      }
    });

    this.$().on('dragenter.karbonsortable', (event) => {
      const item = Ember.$(event.target);
      const droppable = item.closest('.droppable');

      if (droppable.length === 1) {
        droppable.addClass('droppable--enter');
      }

      /*
      else if (item.classList.contains('dropwell')) {
        item.style.opacity = '0.5';
      }
      */
    });

    this.$().on('dragover.karbonsortable', (event) => {
      // prevent default to allow drop
      event.preventDefault();
    });

    this.$().on('dragleave.karbonsortable', (event) => {
      const item = Ember.$(event.target);
      const droppable = item.closest('.droppable--enter');

      if (droppable.length === 1) {
        droppable.removeClass('droppable--enter');
      }
      /* else if (item.classList.contains('dropwell')) {
        item.style.opacity = '';
      } */
    });

    this.$().on('drop.karbonsortable', (event) => {
      event.preventDefault();

      const item = Ember.$(event.target);
      const droppable = item.closest('.droppable--enter');

      if (droppable.length === 1) {
        console.log('droppable--enter: ', droppable);
        const dragged = this.get('draggedEl');
        const parentN = dragged.parentNode;

        const oldIndex = Ember.$(dragged).index();

        const data = this.get('data');
        const dataItem = data.objectAt(oldIndex);

        droppable.removeClass('droppable--enter');

        // have to move the elements to get the transitions to fire
        parentN.removeChild(dragged);
        Ember.$(dragged).insertBefore(droppable);

        const newIndex = Ember.$(dragged).index();

//        const newIndex = Ember.$(droppable).index();

        // Move the data, have to keep the list in sync
        Ember.run.later( () => {
          data.removeAt(oldIndex);
          data.insertAt(newIndex, dataItem);
        }, 1000); // timer has to equal transition ease out

        this.get('onOrderChanged')(dataItem, oldIndex, newIndex);
      }

/*
      if (event.target.classList.contains('dropwell')) {
        alert('dropped');
        event.target.style.opacity = '';
      }
*/
    });

    // append the blank to allow dragging items to the bottom
    let blank = document.createElement('li');
    blank.classList.add('list-item__blank');
    blank.classList.add('droppable');
    this.$().append(blank);
  },

  willDestroyElement() {
    this.$().off('dragstart.karbonsortable');
    this.$().off('dragend.karbonsortable');
    this.$().off('dragenter.karbonsortable');
    this.$().off('dragover.karbonsortable');
    this.$().off('dragleave.karbonsortable');
    this.$().off('drop.karbonsortable');
  }
});
