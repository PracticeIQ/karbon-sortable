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
  canNest: false,
  nestTolerance: 60,

  // The DOM element being dragged
  _draggedEl: null,
  // The initial screenX position at the beginning of a drag
  _screenX: null,

  _isParent: function(node) {
    return (Ember.$(node).next().hasClass('nested'));
  },

  didInsertElement() {
    this.$().on('dragstart.karbonsortable', (event) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.dropEffect = 'move';

      this.set('_draggedEl', event.target);
      if (this.get('canNest')) {

        if (this._isParent(event.target)) {
        } else {
          // alway reset the screenX when starting a drag, it will be used as the
          // basis for detecting deltaX
          this.set('_screenX', null);
        }
      }

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
    });

    this.$().on('dragover.karbonsortable', (event) => {
      // prevent default to allow drop
      event.preventDefault();

      if (this.get('canNest')) {
        const item = Ember.$(event.target);
        const droppable = item.closest('.droppable');
        const dragged = this.get('_draggedEl');


        if (droppable.length === 1) {
          const index = Ember.$(droppable).index();
          const isChild = this.get('data').objectAt(index).get('isChild');

          const screenX = this.get('_screenX');
          const newScreenX = event.originalEvent.screenX;

          if (!screenX) {
            this.set('_screenX', newScreenX);
          } else {
            const deltaX = newScreenX - screenX;
            const nestTolerance = this.get('nestTolerance');

            if (deltaX < (-1 * nestTolerance)) {
              // outdent
              droppable.removeClass('nesting');
              console.log('outdent isChild: ', isChild);
              if (isChild) {
                droppable.removeClass('nested');
              }
            } else if (deltaX > nestTolerance) {
              // indent
              droppable.addClass('nesting');
            }
          }
        }
      }

    });

    this.$().on('dragleave.karbonsortable', (event) => {
      const item = Ember.$(event.target);
      const droppable = item.closest('.droppable--enter');

      if (droppable.length === 1) {
        droppable.removeClass('droppable--enter');
        if (this.get('canNest')) {
          const index = Ember.$(droppable).index();
          const isChild = this.get('data').objectAt(index).get('isChild');

          droppable.removeClass('nesting');
          if (isChild) {
            droppable.addClass('nested');
          }
        }
      }
    });

    this.$().on('drop.karbonsortable', (event) => {
      event.preventDefault();

      const item = Ember.$(event.target);
      const droppable = item.closest('.droppable--enter');
      let isChild = false;
      let isSame = false;

      if (droppable.length === 1) {
        let newIndex = Ember.$(droppable).index();

        const dragged = this.get('_draggedEl');

        // need a better equality test
        if (dragged.id === droppable[0].id) {
          isSame = true;
        }

        if (this.get('canNest')) {
          const screenX = this.get('_screenX');
          const newScreenX = event.originalEvent.screenX;
          const deltaX = newScreenX - screenX;
          const nestTolerance = this.get('nestTolerance');

          if (deltaX > nestTolerance || droppable.hasClass('nesting')) {
            // indent
            dragged.classList.add('nested');
            isChild = true;
          } else if (deltaX < (-1 * nestTolerance)) {
            // outdent
            dragged.classList.remove('nested');
          } else if (this.get('data').objectAt(newIndex).get('isChild')) {
            droppable.addClass('nested');
            isChild = true;
          }

          droppable.removeClass('nesting');
        }

        const parentN = dragged.parentNode;
        const oldIndex = Ember.$(dragged).index();
        const data = this.get('data');
        const dataItem = data.objectAt(oldIndex);

        droppable.removeClass('droppable--enter');

        // Move the data, have to keep the list in sync
        if (!isSame) {
          data.removeAt(oldIndex);
          data.insertAt(newIndex, dataItem);
        }

        dataItem.set('isChild', isChild);

        this.get('onOrderChanged')(dataItem, oldIndex, newIndex, isChild);
      }
    });
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
