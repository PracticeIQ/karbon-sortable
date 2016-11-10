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
  // how many pixels do you have to drag horizontally to indent/outdent
  nestTolerance: 30,

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

  // Changing the class on an element initiates a re-render. Firefox in particular
  // doesn't handle it well. So rather than use addClass/removeClass, we apply
  // the end state as a single change to the element.
  _applyClasses: function(target, toRemove, toAdd) {
    let classList = target.attr('class');

    if (classList) {
      let classes = classList.split(' ');

      if (toRemove && toRemove.length) {
        classes = classes.filter( (item) => {
          return !toRemove.includes(item);
        });
      }

      // make sure not to add duplicates
      if (toAdd && toAdd.length) {
        toAdd.forEach( (item) => {
          if (!classes.includes(item)) {
            classes.push(item);
          }
        });
      }

      target.attr('class', classes.join(' '));
    }
  },

  nestingAllowed: Ember.computed('canNest', '_nestingEnabled', function() {
    return this.get('canNest') && this.get('_nestingEnabled');
  }),

  didInsertElement() {
    this.$().on('dragstart.karbonsortable', (event) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.dropEffect = 'move';

      let dragImage = false;

      this.set('_draggedEl', event.target);
      if (this.get('nestingAllowed')) {
        let children = this._getChildren(event.target);
        const pkid = Ember.$(event.target).attr('data-pkid');
        const dataItem = this.get('data').find( (item) => {
          return item.get('id') === pkid;
        });

        const isSection = dataItem.get('isSection');

        if (children.length > 0 && (event.ctrlKey || event.metaKey)) {
          // We are dragging a group, so normal nesting rules do not apply
          this.set('_nestingEnabled', false);

          Ember.$(event.target).removeClass('droppable');

          children.forEach( (child) => {
            let childEl = Ember.$(child);
            this._applyClasses(childEl, ['droppable'], ['dragging']);
          });

          try {
            event.dataTransfer.setDragImage(document.getElementById('dragGroupImage'), 25, 25);
          } catch(e) {
            // ie doesn't like setDragImage
          }

          dragImage = true;

          this.set('_dragGroup', children);
        } else if (isSection) {
          this.set('_nestingEnabled', false);
          this.set('_screenX', null);
        }else {
          // reset the screenX when starting a drag, it will be used as the
          // basis for detecting deltaX
          this.set('_screenX', null);
        }
      }

      if (!dragImage) {
        try {
          event.dataTransfer.setDragImage(document.getElementById('dragSingleImage'), 15, 15);
        } catch (e) {
          // ie doesn't like setDragImage
        }
      }

      event.target.classList.add('dragging');
    });

    this.$().on('dragend.karbonsortable', (event) => {
      if (event.dataTransfer.dropEffect) {
          const droppable = Ember.$(event.target);

          droppable.removeClass('dragging');
      }

      const children = this.get('_dragGroup');
      Ember.run.later( () => {
        if (children) {
          children.forEach( (child) => {
            let childEl = Ember.$(child);
            this._applyClasses(childEl, ['dragging'], ['droppable']);
          });
        }
      }, 200);

      this.set('_nestingEnabled', true);
    });

    this.$().on('dragenter.karbonsortable', (event) => {
      const item = Ember.$(event.target);
      const droppable = item.closest('.droppable');

      if (droppable.length === 1) {
        droppable.addClass('droppable--enter');
      }
    });

    // dragover fires on the drop element as you drag, throttling is up to the
    // browser, and they do it differently so this can cause bottlenecks. Do
    // the least amount of work possible, and return if anything is amiss,
    // as the next event will clear it up. Unfortunately we have to handle
    // border management and indenting/outdenting from here. Only apply rendering
    // changes if you have to (they are more expensive than the checks).
    this.$().on('dragover.karbonsortable', (event) => {
      // prevent default to allow drop
      event.preventDefault();

      const item = Ember.$(event.target);
      const droppable = item.closest('.droppable');

      // Make sure we got one, in case they were able to drop somewhere else (css bug)
      if (droppable.length === 1) {
        const dragged = this.get('_draggedEl');
        const draggedIndex = Ember.$(dragged).index();
        const index = Ember.$(droppable).index();
        const isSame = (index === draggedIndex);
        const dataItem = this.get('data').objectAt(index);

        if (isSame) {
          if (this.get('nestingAllowed')) {
            // indent/outdent
            const isChild = dataItem.get('isChild');
            const screenX = this.get('_screenX');
            const newScreenX = event.originalEvent.screenX;

            if (!screenX) {
              this.set('_screenX', newScreenX);
            } else {
              const deltaX = newScreenX - screenX;
              const nestTolerance = this.get('nestTolerance');

              if (deltaX < (-1 * nestTolerance)) {
                // outdent
                if (isChild) {
                  this._applyClasses(droppable, ['nesting', 'nested'], null);
                } else {
                  droppable.removeClass('nesting');
                }
              } else if (deltaX > nestTolerance) {
                // indent
                droppable.addClass('nesting');
              }
            }
          }
        } else {
          // check/flip the borders
          const height = event.target.clientTop + event.target.clientHeight;

          let classList = droppable.attr('class');

          // if we get flooded with dragover events the class attr may not be set (ff),
          // skip everything and pick it up on the next cycle
          if (classList) {

            const next = Ember.$(droppable).next();

            if (event.originalEvent.offsetY < (height / 2)) {
              this._applyClasses(droppable, ['droppable--below'], ['droppable--above']);

              if (next) {
                next.addClass('spacer');
              }
            } else if (event.originalEvent.offsetY > (height / 2)) {
              this._applyClasses(droppable, ['droppable--above'], ['droppable--below']);

              if (next) {
                next.removeClass('spacer');
              }
            }
          }
        }
      }
    });

    this.$().on('dragleave.karbonsortable', (event) => {
      const dragged = this.get('_draggedEl');
      const draggedIndex = Ember.$(dragged).index();
      const item = Ember.$(event.target);
      const droppable = item.closest('.droppable');
      const index = Ember.$(droppable).index();
      const isSame = (draggedIndex === index);

      if (droppable.length === 1) {
        if (isSame) {
          if (this.get('nestingAllowed')) {
            const isChild = this.get('data').objectAt(index).get('isChild');

            if (isChild) {
              this._applyClasses(droppable, ['nesting'], ['nested']);
            } else {
              droppable.removeClass('nesting');
            }
          }
        } else {
          this._applyClasses(droppable, ['droppable--enter', 'droppable--below', 'droppable--above'], ['spacer']);

          const next = Ember.$(droppable).next();

          if (next) {
            next.addClass('spacer');
          }
        }
      }
    });

    //
    // On drop we need to cleanup the borders, and animate the changes. Nesting
    // and the 50/50 rule really complicate things.
    //
    // For the 50/50 rule, we have to adjust the target drop index depending on
    // whether we are dragging down or up, and whether the drop is above or
    // below the target.
    //
    // The animations require similar conditions. When dragging up, we can remove
    // and insert the data element, and after render animate the new item height.
    // For dragging down, we have to insert the new element, then animate it in
    // and animate the old out, then remove the data item. This means the index
    // calculations are different in each case.
    //
    //
    this.$().on('drop.karbonsortable', (event) => {
      event.preventDefault();

      const item = Ember.$(event.target);
      const droppable = item.closest('.droppable--enter');

      if (droppable.length === 1) {
        const dragged = this.get('_draggedEl');
        const oldIndex = Ember.$(dragged).index();
        let newIndex = Ember.$(droppable).index();

        const dropDataItem = this.get('data').objectAt(oldIndex);
        let isChild = dropDataItem.get('isChild');

        // Because we insert above or below based on whether you are on the
        // top or bottom half of the drop target, we have to adjust the insertion
        // indices (we insertAt into the list)
        if (oldIndex < newIndex) {
          // dragging down
          // below is fine, above needs - 1
          if (droppable.hasClass('droppable--above')) {
            newIndex = newIndex - 1;
          }
        } else if (oldIndex > newIndex) {
          // dragging up
          // above is fine, below needs + 1
          if (droppable.hasClass('droppable--below')) {
            newIndex = newIndex + 1;
          }

        }

        const isSame = (oldIndex === newIndex);

        // Nesting will not be allowed if the drop is for a parent. This is to make sure
        // A single drop is nested correctly
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
              this._applyClasses(Ember.$(dragged), ['nested', 'nesting'], null);
              isChild = false;
            }
          }

          droppable.removeClass('nesting');
        }

        const data = this.get('data');
//        const dataItem = data.objectAt(oldIndex);

        // clear the borders
        this._applyClasses(droppable, ['droppable--enter', 'droppable--above', 'droppable--below'], ['spacer']);

        const next = Ember.$(droppable).next();

        if (next) {
          next.addClass('spacer');
        }

        const children = this.get('_dragGroup');

        // move stuff around and animate
        if (!isSame) {
          if (children) {
            // reset the children before we starting moving things
            Ember.$(dragged).addClass('droppable');

            children.forEach( (child) => {
              let childEl = Ember.$(child);
              childEl.removeClass('dragging');
              childEl.addClass('droppable');
            });
          }

          if (newIndex < oldIndex) {
            // If dragging up, we can remove the old and insert the new
            data.removeAt(oldIndex);
            data.insertAt(newIndex, dropDataItem);

            if (children) {
              for (let i = 1; i <= children.length; i++) {
                let child = data.objectAt(oldIndex + i);

                data.removeAt(oldIndex + i);
                data.insertAt(newIndex + i, child);
              }
            }

          } else {
            // If dragging down, we can insert the new, but have to wait to
            // remove the old until it's animated away
            data.insertAt(newIndex + 1, dropDataItem);

            if (children) {
              for (let i = 1; i <= children.length; i++) {
                let child = data.objectAt(oldIndex + i);
                data.insertAt(newIndex + 1 + i, child);
              }

            }
          }


          // Fire animations after the render from data moves has completed
          Ember.run.scheduleOnce('afterRender', () => {
            if (this && !this.get('isDestroyed')) {
              if (oldIndex > newIndex) {
                // drag up
                let target;

                if (children) {
                  let start = (newIndex) ? (newIndex - 1) : 0;
                  target = this.$('.droppable:gt(' + start + '):lt(' + (children.length + 1) + ')');
                } else {
                  target = this.$('.droppable:eq(' + (newIndex) + ')');
                }

                target.css('height', '0px');
                target.css('opacity', '0.4');

                // animate in
                target.animate({
                  height: '59px',
                  opacity: 1
                }, 500, function() {
                  target.css('height', '');
                  target.css('opacity', '');
                });
              } else {
                // drag down
                let target, orig;

                if (children) {
                  orig = this.$('.droppable:gt(' + (oldIndex - 1) + '):lt(' + (children.length + 1) +')');
                  target = this.$('.droppable:gt(' + (newIndex) + '):lt(' + (children.length + 1) + ')');
 //                 target.slice(1).css('margin-left', '60px').css('width', '240px');
                } else {
                  orig = this.$('.droppable:eq(' + (oldIndex) + ')');
                  target = this.$('.droppable:eq(' + (newIndex + 1) + ')');
                }


                if (orig) {
                  // animate original out
                  orig.animate({
                    height: '0px'
                  }, 500, () => {
                    orig.css('height', '');
                    data.removeAt(oldIndex);
                  });
                }


                target.css('height', '0px');
                target.css('opacity', '0.4');

                // animate new one in
                target.animate({
                  height: '59px',
                  opacity: 1
                }, 500, function() {
                  target.css('height', '');
                  target.css('opacity', '');
//                  target.css('margin-left', '');
//                  target.css('width', '');
                });
              }
            }
          });
        }

        this.set('_dragGroup', null);
        dropDataItem.set('isChild', isChild);
        const childCount = (children) ? children.length : 0;

        let adjustedIndex = newIndex;
        if (children && (oldIndex < newIndex)) {
          adjustedIndex = newIndex - children.length;
        }

        this.get('onOrderChanged')(dropDataItem, oldIndex, adjustedIndex, isChild, childCount);
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
