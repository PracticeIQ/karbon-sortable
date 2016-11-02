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
  // is the nesting feature enabled or not
  canNest: false,
  nestTolerance: 60,

  // The DOM element being dragged
  _draggedEl: null,
  // The initial screenX position at the beginning of a drag
  _screenX: null,

  // We enable/disable nesting during certain operations, regardless
  // of the canNest user setting
  _nestingEnabled: true,

  // When dragging parents and children, keep the data here
  _dragGroup: null,

  _getChildren: function(node) {
    let children = [];
    const data = this.get('data');
    const index = Ember.$(node).index();

    // we must not be a child
    if (data.objectAt(index).get('isChild')) {
      return [];
    }

    // must have at least one item below us
    if (index < (data.get('length') - 1)) {

      let nextPos = index + 1;
      let nextNode = Ember.$(node).next();
      let nextData = data.objectAt(nextPos);

      while (nextData.get('isChild')) {
        children.push(nextNode);
        nextNode = Ember.$(nextNode).next();
        nextPos++;
        if (nextPos >= data.get('length')) {
          break;
        }
        nextData = data.objectAt(nextPos);
      }
    }

    return children;
  },

  nestingAllowed: Ember.computed('canNest', '_nestingEnabled', function() {
    return this.get('canNest') && this.get('_nestingEnabled');
  }),

  didInsertElement() {
    this.$().on('dragstart.karbonsortable', (event) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.dropEffect = 'move';

      this.set('_draggedEl', event.target);
      if (this.get('nestingAllowed')) {
        let children = this._getChildren(event.target);
        if (children.length > 0 && event.altKey) {
          // We are dragging a group, so normal nesting rules do not apply
          this.set('_nestingEnabled', false);

          Ember.$(event.target).removeClass('droppable');

          children.forEach( (child) => {
            let childEl = Ember.$(child);
            childEl.addClass('dragging');
            childEl.removeClass('droppable');
          });

          event.dataTransfer.setDragImage(document.getElementById('dragGroupImage'), 25, 25);

          this.set('_dragGroup', children);

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
          event.target.classList.add('droppable');
          Ember.run.later( () => {
              event.target.classList.remove('dragging');
              event.target.classList.remove('dropping');
          }, 1000);
      }

      const children = this.get('_dragGroup');
      Ember.run.later( () => {
        if (children) {
          children.forEach( (child) => {
            let childEl = Ember.$(child);
            childEl.removeClass('dragging');
            childEl.addClass('droppable');
          });
        }
      }, 200);

      this.set('_nestingEnabled', true);
    });

    this.$().on('dragenter.karbonsortable', (event) => {
      const item = Ember.$(event.target);
      const droppable = item.closest('.droppable');

      if (droppable.length === 1) {
//        console.log('dragenter event: ', event);
        droppable.addClass('droppable--enter');
      }
    });

    this.$().on('dragover.karbonsortable', (event) => {
      // prevent default to allow drop
      event.preventDefault();

      const item = Ember.$(event.target);
      const droppable = item.closest('.droppable');

      const height = event.target.clientTop + event.target.clientHeight;

      const next = Ember.$(droppable).next();

      if (event.originalEvent.offsetY < (height / 2)) {
        droppable.addClass('droppable--above');
        droppable.removeClass('droppable--below');

        if (next) {
          next.addClass('spacer');
        }
      } else {
        droppable.addClass('droppable--below');
        droppable.removeClass('droppable--above');
        droppable.addClass('spacer');

        if (next) {
          next.removeClass('spacer');
        }
      }

      if (this.get('nestingAllowed')) {
        const dragged = this.get('_draggedEl');

        let isSame = false;

        if (!dragged || !droppable.length) {
          console.log('on dragover missing dragged: ', dragged,
                      ' droppable.length: ', droppable.length);
        }

        if (dragged && droppable.length && (dragged.id === droppable[0].id)) {
          isSame = true;
        }

        if (droppable.length === 1 && isSame) {
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
              console.log('dragover outdent isChild: ', isChild);
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
        droppable.removeClass('droppable--below');
        droppable.removeClass('droppable--above');

        if (this.get('nestingAllowed')) {
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


        // nesting will not be allowed if the drop is for a parent
        if (this.get('nestingAllowed')) {
          const screenX = this.get('_screenX');
          const newScreenX = event.originalEvent.screenX;
          const deltaX = newScreenX - screenX;
          const nestTolerance = this.get('nestTolerance');

          if (isSame) {

            if (deltaX > nestTolerance || droppable.hasClass('nesting')) {
              // indent
              dragged.classList.add('nested');
              isChild = true;
            } else if (deltaX < (-1 * nestTolerance)) {
              // outdent
              dragged.classList.remove('nested');
            }
          }

          if (!isSame && this.get('data').objectAt(newIndex).get('isChild')) {
            droppable.addClass('nested');
          }

          droppable.removeClass('nesting');
        }

        const oldIndex = Ember.$(dragged).index();
        const data = this.get('data');
        const dataItem = data.objectAt(oldIndex);

        droppable.removeClass('droppable--enter');
        droppable.removeClass('droppable--above');
        droppable.removeClass('droppable--below');
        droppable.addClass('spacer');
        const next = Ember.$(droppable).next();
        if (next) {
          next.addClass('spacer');
        }

        const children = this.get('_dragGroup');

        // Move the data, have to keep the list in sync
        if (!isSame) {
          data.removeAt(oldIndex);
          data.insertAt(newIndex, dataItem);

          if (children) {
            // dragging down
            if (newIndex > oldIndex) {
              for (let i = 1; i <= children.length; i++) {
                let child = data.objectAt(oldIndex);

                data.removeAt(oldIndex);
                data.insertAt(newIndex, child);
              }
            } else {
              // dragging up
              for (let i = 1; i <= children.length; i++) {
                let child = data.objectAt(oldIndex + i);

                data.removeAt(oldIndex + i);
                data.insertAt(newIndex + i, child);
              }
            }

            Ember.run.later( () => {
              if (children) {
                children.forEach( (child) => {
                  let childEl = Ember.$(child);
                  childEl.removeClass('dragging');
                  childEl.addClass('droppable');
                });
              }
            }, 200);

          }
        }

        this.set('_dragGroup', null);

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
