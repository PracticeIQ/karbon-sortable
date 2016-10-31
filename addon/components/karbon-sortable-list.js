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
  // Whether the currently dragged item is already indented
  _indented: null,

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

          // check to see if the item to drag is already indented
          if (event.target.classList.contains('nested')) {
            this.set('_indented', true);
          } else {
            this.set('_indented', false);
          }
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

        if (droppable.length === 1) {
          const screenX = this.get('_screenX');
          const newScreenX = event.originalEvent.screenX;
          const indented = this.get('_indented');

          if (!screenX) {
            this.set('_screenX', newScreenX);
          } else {
            const deltaX = newScreenX - screenX;
            const nestTolerance = this.get('nestTolerance');

            if (deltaX < (-1 * nestTolerance)) {
              // outdent
              droppable.removeClass('nesting');
              this.set('_indented', false);
            } else if (deltaX > nestTolerance || indented) {
              // indent
              droppable.addClass('nesting');
            }
            // else leave unchanged
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
          // *** need to know if it was nested before hand...don't remove if it was
          droppable.removeClass('nesting');
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
          const indented = this.get('_indented');
          const newScreenX = event.originalEvent.screenX;
          const deltaX = newScreenX - screenX;
          const nestTolerance = this.get('nestTolerance');

          if (deltaX > nestTolerance || indented) {
            // indent
            dragged.classList.add('nested');
            isChild = true;
          } else if (deltaX < (-1 * nestTolerance)) {
            // outdent
            dragged.classList.remove('nested');
          }
          // else leave unchanged

          // always remove the highlight
          if (!isSame) {
            // *** need to know if it was nested beforehand...don't remove if it was
            droppable.removeClass('nesting');
          }
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

          this.get('onOrderChanged')(dataItem, oldIndex, newIndex, isChild);
        }

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
