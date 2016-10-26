import Ember from 'ember';
import layout from '../templates/components/karbon-sortable-list';

export default Ember.Component.extend({
  tagName: 'ul',
  classNames: ['karbon-sortable-list'],
  layout,

  // The DOM element being dragged
  draggedEl: null,

  // Lifecycle
  didInsertElement() {
    this.$().on('dragstart.karbonsortable', (event) => {
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

      // Yikes, paramterize the styles!
      if (droppable) {
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

      if (droppable) {
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

      if (droppable) {
        droppable.removeClass('droppable--enter');

        const dragged = this.get('draggedEl');
        const parentN = dragged.parentNode;

        parentN.removeChild(dragged);
        Ember.$(dragged).insertBefore(droppable);
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
