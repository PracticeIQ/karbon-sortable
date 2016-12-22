import Ember from 'ember';
import layout from '../templates/components/karbon-sortable-list';

/**
 * A container for sortable items. Items within the list can be sorted via
 * dragging and dropping them into a new position. You can also identify
 * external drop targets for non-sorting actions using a dropwell.
 */

export default Ember.Component.extend({
  tagName: 'ul',
  classNames: ['karbon-sortable-list'],
  classNameBindings: ['containerClass'],

  layout,
  // is the nesting feature enabled or not
  canNest: false,
  // how many pixels do you have to drag horizontally to indent/outdent
  nestTolerance: 60,
  animateSpeed: 500,

  // The DOM element being dragged
  _draggedEl: null,
  _draggedItem: null,
  // The initial screenX position at the beginning of a drag
  _screenX: null,

  // We enable/disable nesting during certain operations, regardless
  // of the canNest user setting
  _nestingEnabled: true,
  _isSame: false,
  _isSection: false,
  _lastSectionNode: null,
  _isPinned: false,

  // When dragging parents and children, keep the data here
  _dragGroup: null,

  _getParentKey: function(item) {
    const data = this.get('data');
    const index = data.indexOf(item);

    // not sure how it could be 0, but
    if (index > 0) {
      const precedent = data.objectAt(index - 1);
      let parentKey = precedent.get('parentChecklistItem');
      if (parentKey) {
        return parentKey;
      } else {
        return precedent.get('id');
      }
    }
  },

  _itemForNode: function(node) {
    const pkid = Ember.$(node).attr('data-pkid');
    const dataItem = this.get('data').find( (item) => {
      return item.get('id') === pkid;
    });

    return dataItem;
  },

  _getChildren: function(node) {
    let children = [];
    const data = this.get('data');
    const dataItem = this._itemForNode(node);
    const index = data.indexOf(dataItem);

    // we must not be a child
    if (dataItem.get('isChild')) {
      return [];
    }

    if (dataItem.get('isSection')) {
      // get all items in the section
      if (!dataItem.get('sectionIsCollapsed') && index < (data.get('length') - 1)) {
        let nextPos = index + 1;
        let nextNode = Ember.$(node).next();
        let nextData = data.objectAt(nextPos);

        while (!nextData.get('isSection')) {
          children.push(nextNode);
          nextNode = Ember.$(nextNode).next();
          nextPos++;
          if (nextPos >= data.get('length')) {
            break;
          }
          nextData = data.objectAt(nextPos);
        }
      }

    // must have at least one item below us
    } else if (index < (data.get('length') - 1)) {
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

  _getHiddenChildren: function(dataItem) {
    let children = [];
    const data = this.get('data');
    const index = data.indexOf(dataItem);

    if (dataItem.get('isSection') && dataItem.get('sectionIsCollapsed')) {
      for (let i = index + 1; i < data.get('length'); i++) {
        const nextItem = data.objectAt(i);
        if (nextItem.get('isSection')) {
          break;
        }

        children.push(nextItem);
      }
    }

    return children;
  },

  // this gets called a lot, avoid rescans in callbacks, just
  // use a flat scan
  _lastItemInSection: function(sectionItem) {
    const data = this.get('data');
    const myIndex = data.indexOf(sectionItem);

    if (myIndex < data.get('length')) {
      for (let i = myIndex + 1; i < data.get('length'); i++) {
        if (data.objectAt(i).get('isSection')) {
          return data.objectAt(i - 1);
        }
      }

      return data.objectAt(data.get('length') - 1);
    }
  },

  _getSectionItem: function(item) {
    const data = this.get('data');
    const myIndex = data.indexOf(item);

    if (myIndex > 0) {
      for (let i = myIndex - 1; i >= 0; i--) {
        const nextObject = data.objectAt(i);
        if (nextObject.get('isSection')) {
          return nextObject;
        }
      }
    }
  },

  // Changing the class on an element initiates a re-render. Firefox in particular
  // doesn't handle it well. So rather than use addClass/removeClass, we apply
  // the end state as a single change to the element. Try not to call this more
  // than once per render (ie method).
  _applyClasses: function(target, toRemove, toAdd) {
    let classList = target.attr('class') || '';

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

  // applies borders above or below the droppable based on the 50/50 rule
  _itemBorders: function (droppable, event) {
    const next = Ember.$(droppable).next();
    const height = Ember.$(droppable).height();

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
  },

  nestingAllowed: Ember.computed('canNest', '_nestingEnabled', function() {
    return this.get('canNest') && this.get('_nestingEnabled');
  }),

  _grabChildren: function(el, item, release) {
    if (release) {
      let children = this.get('_dragGroup');

      if (children) {
        children.forEach( (child) => {
          let childEl = Ember.$(child);

          this._applyClasses(childEl, ['dragging'], null);
        });
      }

      this.set('_dragGroup', null);
      this.set('_nestingEnabled', true);
    } else {
      let children = this._getChildren(el);

      // We are dragging a group, so normal nesting rules do not apply
      this.set('_nestingEnabled', false);

      children.forEach( (child) => {
        let childEl = Ember.$(child);

        this._applyClasses(childEl, null, ['dragging']);
      });

      this.set('_dragGroup', children);
    }
  },

  // Pinned items cannot be indented
  _amIPinned: function(dataItem) {
    const data = this.get('data');
    const myIndex = data.indexOf(dataItem);

    if (myIndex === 0) {
      return true;
    }

    const mySection = this._getSectionItem(dataItem);

    if (mySection) {
      const sectionIndex = data.indexOf(mySection);

      if (myIndex === (sectionIndex + 1)) {
        return true;
      }
    }

    return false;
  },

  didInsertElement() {
    // --- dragstart ---
    this.$().on('dragstart.karbonsortable', (event) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.dropEffect = 'move';

      this.set('_draggedEl', event.target);
      const dataItem = this._itemForNode(event.target);
      this.set('_draggedItem', dataItem);

      if (this.get('nestingAllowed')) {
        this.set('_dragGroup', null);
        this.set('_isPinned', false);

        const isSection = dataItem.get('isSection');

        this.set('_isSection', isSection);

        if (isSection) {
          this._grabChildren(event.target, dataItem);
        } else {
          this.set('_isPinned', this._amIPinned(dataItem));
        }

        // reset the screenX when starting a drag, it will be used as the
        // basis for detecting deltaX
        this.set('_screenX', null);
      }

      try {
        const dragImageEl = document.getElementById('dragSingleImage');
        const width = Ember.$(dragImageEl).width();
        const height = Ember.$(dragImageEl).height();

        event.dataTransfer.setDragImage(dragImageEl, Math.floor(width/2), Math.floor(height/2));
      } catch (e) {
        // ie doesn't like setDragImage
      }

      Ember.run.scheduleOnce('afterRender', () => {
        this._applyClasses(Ember.$(event.target), null, ['dragging']);
      });
    });

    // --- dragend ---
    this.$().on('dragend.karbonsortable', (event) => {
      const ANIMATE_SPEED = this.get('animateSpeed');

      if (event.dataTransfer.dropEffect) {
          const droppable = Ember.$(event.target);

          Ember.run.later( () => {
            droppable.removeClass('dragging');
          }, ANIMATE_SPEED);
      }

      const children = this.get('_dragGroup');
      Ember.run.later( () => {
        if (children) {
          children.forEach( (child) => {
            let childEl = Ember.$(child);
            this._applyClasses(childEl, ['dragging'], ['droppable']);
          });
        }
      }, ANIMATE_SPEED);

      // we have to handle indenting/outdenting here, because you can drop outside
      // the target to change the indentation
      if (!children && this.get('_isSame') && this.get('nestingAllowed')) {
        const dragged = this.get('_draggedEl');
        const draggedEl = Ember.$(dragged);
        const dropDataItem = this._itemForNode(dragged);
        const oldIndex = this.get('data').indexOf(dropDataItem);

        let isChild = dropDataItem.get('isChild');

        if (draggedEl.hasClass('nesting')) {
          // indent
          this._applyClasses(draggedEl, ['nesting'], ['nested']);
          isChild = true;
        } else if (!draggedEl.hasClass('nested')){
          // outdent
          isChild = false;
        }

        if (isChild) {
          // Only do the lookups if this is a transition
          if (!dropDataItem.get('isChild')) {
            dropDataItem.set('parentChecklistItem', this._getParentKey(dropDataItem));
          }
        } else {
          // this one's cheap
          dropDataItem.set('parentChecklistItem', null);
        }


        Ember.run.later( () => {
          this.get('onOrderChanged')(dropDataItem, oldIndex, oldIndex, isChild, 0);
        }, 100);

      }

      this.set('_nestingEnabled', true);
    });


    // When you indent/outdent, the cursor may leave the droppable targets (you
    // aren't aiming for a drop target, just a delta in horizontal movement). This
    // means we have to handle indent/outdent via drag and drag end, not drag over
    // and drop. These must be kept orthogonal operations.
    this.$().on('drag.karbonsortable', (event) => {
      const dragged = this.get('_draggedEl');
      const draggedEl = Ember.$(dragged);
      const isSame = this.get('_isSame');
      const isSection = this.get('_isSection');
      const isPinned = this.get('_isPinned');

      if (isSame && !isSection && !isPinned) {
        if (this.get('nestingAllowed')) {
          // indent/outdent
          const screenX = this.get('_screenX');
          const newScreenX = event.originalEvent.screenX;

          const nest = draggedEl.hasClass('nesting') || draggedEl.hasClass('nested');

          if (!screenX) {
            this.set('_screenX', newScreenX);
          } else {
            const deltaX = newScreenX - screenX;
            const nestTolerance = this.get('nestTolerance');

            if (deltaX < (-1 * nestTolerance) && nest) {
              // outdent
              this._applyClasses(draggedEl, ['nesting', 'nested'], null);
              this.set('_screenX', newScreenX);
            } else if (deltaX > nestTolerance && !nest) {
              // indent
              this._applyClasses(draggedEl, null, ['nesting']);
              this.set('_screenX', newScreenX);
            }
          }
        }
      }
    });

    // dragover fires on the drop element as you drag, throttling is up to the
    // browser, and they do it differently so this can cause bottlenecks. Do
    // the least amount of work possible, and return if anything is amiss,
    // as the next event will clear it up. Unfortunately we have to handle
    // border management from here. Only apply rendering
    // changes if you have to (they are more expensive than the checks).
    this.$().on('dragover.karbonsortable', (event) => {
      // prevent default to allow drop
      event.preventDefault();

      const item = Ember.$(event.target);
      const droppable = item.closest('.droppable');

      // Make sure we got one, in case they were able to drop somewhere else
      if (droppable.length === 1) {
        const dropItem = this._itemForNode(droppable);
        const dragged = this.get('_draggedEl');
        const draggedItem = this.get('_draggedItem');
        const draggedIndex = this.get('data').indexOf(draggedItem);
        const index = this.get('data').indexOf(dropItem);
        const isSame = (index === draggedIndex);
        const isSection = this.get('_isSection');
        const isDragging = Ember.$(droppable).hasClass('dragging');
        const up = index < draggedIndex;

        const isPinned = this.get('_isPinned');
        const oldIsSame = this.get('_isSame');

        if (isSame !== oldIsSame) {
          if (isSame && !isPinned) {
            // transition to indenting
            this._grabChildren(dragged, draggedItem, true);
          } else {
            // transition to dragging
            this._grabChildren(dragged, draggedItem);
          }
        }

        this.set('_isSame', isSame);

        if (!isSame && !isSection && !isDragging) {
          // check/flip the borders

          let classList = droppable.attr('class');

          // if we get flooded with dragover events the class attr may not be set (ff),
          // skip everything and pick it up on the next cycle
          if (classList) {
            this._itemBorders(droppable, event);
          }
        } else if (!isSame && isSection && dropItem) {
          // we're dragging a section, but we need to know what we're over
          const draggedSectionId = draggedItem.get('id');

          if (dropItem.get('isSection')) {
            // We're over a section, is it collapsed?
            if (dropItem.get('sectionIsCollapsed')) {
              if (!up) {
                this._applyClasses(droppable, ['droppable--above'], ['droppable--below']);
              } else {
                this._applyClasses(droppable, ['droppable--below'], ['droppable--above']);
              }
            } else {
              //
              // if we are over a section item that is not us, and it is expanded,
              // put the border on the last item in the section
              //
              // We can't count on there being another section - btw, this is a bug
              // in the current implementation...
              //

              if (!up) {
                // border goes on last item in section
                const lastItemId = this._lastItemInSection(dropItem).get('id');

                // need the node for this item
                const lastNode = this.$("[data-pkid='" + lastItemId + "']");

                this.set('_lastSectionNode', lastNode);
                this._applyClasses(lastNode, ['droppable--above'], ['droppable--below']);
              } else {
                // goes on section header
                const sectionNode = this.$("[data-pkid='" + dropItem.get('id') + "']");

                this.set('_lastSectionNode', sectionNode);
                this._applyClasses(sectionNode, ['droppable--below'], ['droppable--above']);
              }
            }
          } else if (!isSame) {
            // we're over an item, is it in our section?
            const mySectionItem = this._getSectionItem(dropItem);

            if (!mySectionItem) {
              // We dragged over an item that is not in a section, only possible if the item is
              // above all sections. In this case you are only allowed to drop above the orphans,
              // put the border on top.

              const first = this.$('.droppable:eq(0)');
              this.set('_lastSectionNode', first);

              this._applyClasses(first, ['droppable--below'], ['droppable--above']);

              return;
            }

            const mySectionId = mySectionItem.get('id');

            if (mySectionId !== draggedSectionId) {
              if (!up) {
                // border goes on last item in section
                const lastItemId = this._lastItemInSection(dropItem).get('id');

                // need the node for this item
                const lastNode = this.$("[data-pkid='" + lastItemId + "']");

                this.set('_lastSectionNode', lastNode);
                this._applyClasses(lastNode, ['droppable--above'], ['droppable--below']);
              } else {
                const sectionNode = this.$("[data-pkid='" + mySectionId + "']");
                // poor name
                this.set('_lastSectionNode', sectionNode);
                this._applyClasses(sectionNode, ['droppable--below'], ['droppable--above']);
              }
            }
          }
        }
      }
    });

    // --- dragleave ---
    this.$().on('dragleave.karbonsortable', (event) => {
      const dragged = this.get('_draggedEl');
      const draggedItem = this._itemForNode(dragged);
      const draggedIndex = this.get('data').indexOf(draggedItem);
      const item = Ember.$(event.target);
      const droppable = item.closest('.droppable');
      const droppableItem = this._itemForNode(droppable);
      const index = this.get('data').indexOf(droppableItem);
      const isSame = (draggedIndex === index);

      if (droppable.length === 1) {
        if (!isSame) {
          this._applyClasses(droppable, ['droppable--below', 'droppable--above', 'nesting'], ['spacer']);

          const next = Ember.$(droppable).next();

          if (next) {
            this._applyClasses(next, null, ['spacer']);
          }

          const lastSectionNode = this.get('_lastSectionNode');

          if (lastSectionNode) {
            this._applyClasses(lastSectionNode, ['droppable--below', 'droppable--above'], ['spacer']);
            this.set('_lastSectionNode', null);
          }
        } else {
          this._applyClasses(droppable, ['nesting'], null);
        }
      }
    });

    //
    // On drop we need to cleanup the borders, and animate the changes. Nesting
    // and the 50/50 rule really complicate things, as do sections.
    //
    // For the 50/50 rule, we have to adjust the target drop index depending on
    // whether we are dragging down or up, and whether the drop is above or
    // below the target.
    //
    // The animations require similar conditions. To make the transitions smooth,
    // we insert the new elements and give them a height of 0, then animate them
    // in at the same time we animate the old ones out. Then we remove the old
    // ones from the list. The index calculations are different depending on whether
    // you are dragging up or dragging down as well.
    //
    this.$().on('drop.karbonsortable', (event) => {
      event.preventDefault();

      const item = Ember.$(event.target);
      const droppable = item.closest('.droppable');

      if (droppable.length === 1) {
        const clientHeight = Ember.$(droppable).height();
        const data = this.get('data');
        const dragged = this.get('_draggedEl');
        const draggedDataItem = this.get('_draggedItem');
        const droppedDataItem = this._itemForNode(droppable);

        const oldDataIndex = data.indexOf(draggedDataItem);
        let newDataIndex = data.indexOf(droppedDataItem);

        const oldIndex = Ember.$(dragged).index();
        let newIndex = Ember.$(droppable).index();

        const up = oldIndex > newIndex;
        const isSection = this.get('_isSection');
        let isChild = draggedDataItem.get('isChild');

        // -----------------------------------------
        // Adjust the old/new indices based on what we're doing so we move and
        // animate everything in the right place.
        // -----------------------------------------
        if (!isSection) {
          // Because we insert above or below based on whether you are on the
          // top or bottom half of the drop target, we have to adjust the insertion
          // indices (we insertAt into the list)
          if (!up) {
            // dragging down
            // below is fine, above needs - 1
            if (droppable.hasClass('droppable--above')) {
              newIndex = newIndex - 1;
              newDataIndex = newDataIndex - 1;
            }
          } else if (up) {
            // dragging up
            // above is fine, below needs + 1
            if (droppable.hasClass('droppable--below')) {
              newIndex = newIndex + 1;
              newDataIndex = newDataIndex + 1;
            }
          }
        } else {
          const draggedSectionId = draggedDataItem.get('id');

          // For sections, the drop index needs to line up on a section, even
          // though you may have dropped on an item
          if (droppedDataItem.get('isSection')) {

            // if you drop on yourself (section) ignore
            if (draggedSectionId === droppedDataItem.get('id')) {
              return;
            }

            if (droppedDataItem.get('sectionIsCollapsed')) {
              if (up) {
                // fine
              } else {
                // newIndex is fine, but the items are hidden, adjust the dataindex
                const lastItem = this._lastItemInSection(droppedDataItem);
                newDataIndex = data.indexOf(lastItem);
              }
            } else {
              if (up) {
                // fine
              } else {
                const lastItem = this._lastItemInSection(droppedDataItem);
                newDataIndex = data.indexOf(lastItem);

                const lastNode = this.$("[data-pkid='" + lastItem.get('id') + "']");
                newIndex = lastNode.index();

                // this one slips through because it's not the drop target
                this._applyClasses(lastNode, ['droppable--below'], null);
              }
            }
          } else {
            const mySectionItem = this._getSectionItem(droppedDataItem);

            if (!mySectionItem) {
              // we're dropping on an item that is not in a section, so it must
              // be above all sections. We only allow dropping on top of the list
              // of orphans.

              newIndex = 0;
              newDataIndex = 0;

              const node = this.get('_lastSectionNode');
              if (node) {
                this._applyClasses(node, ['droppable--above'], null);
              }

            } else {

              const mySectionId = mySectionItem.get('id');

              if (mySectionId !== draggedSectionId) {
                if (up) {
                  const sectionNode = this.$("[data-pkid='" + mySectionId + "']");
                  newIndex = sectionNode.index();
                  newDataIndex = data.indexOf(mySectionItem);

                  this._applyClasses(sectionNode, ['droppable--above'], null);
                } else {
                  const lastItem = this._lastItemInSection(droppedDataItem);
                  newDataIndex = data.indexOf(lastItem);

                  const lastNode = this.$("[data-pkid='" + lastItem.get('id') + "']");
                  newIndex = lastNode.index();

                  this._applyClasses(lastNode, ['droppable--below'], null);
                }
              } else {
                // We dropped over an item in our own section, ignore
                return;
              }
            }
          }
        }


        const isSame = (oldIndex === newIndex);

        // clear the borders
        this._applyClasses(droppable, ['droppable--above', 'droppable--below'], ['spacer']);

        const next = Ember.$(droppable).next();

        if (next) {
          next.addClass('spacer');
        }

        const children = this.get('_dragGroup');
        let hiddenChildren;

        if (isSection && draggedDataItem.get('sectionIsCollapsed')) {
          // when we move a collapsed section, we don't have to deal with the children
          // visually, but we need to make sure we move them in the backing list.
          hiddenChildren = this._getHiddenChildren(draggedDataItem);
        }


        // -----------------------------------------
        // Move stuff around and animate
        // -----------------------------------------

        const ANIMATE_SPEED = this.get('animateSpeed');

        if (!isSame) {
          if (children) {
            // reset the children before we starting moving things
            Ember.$(dragged).addClass('droppable');

            Ember.run.later( () => {
              children.forEach( (child) => {
                this._applyClasses(child, ['dragging'], ['droppable']);
              });
            }, ANIMATE_SPEED);
          }

          if (up) {
            // If dragging up, we insert the new, which will push all the
            // old down
            data.insertAt(newDataIndex, draggedDataItem);

            if (children && children.length) {
              for (let i = 1; i <= children.length; i++) {
                let child = data.objectAt(oldDataIndex + (2 * i));

                data.insertAt(newDataIndex + i, child);
              }
            } else if (hiddenChildren && hiddenChildren.length) {
              for (let i = 1; i <= hiddenChildren.length; i++) {
                let child = data.objectAt(oldDataIndex + (2 * i));

                data.insertAt(newDataIndex + i, child);
              }
            }
          } else {
            // If dragging down, we insert the new, and the old
            // indices are unaffected because they are above
            data.insertAt(newDataIndex + 1, draggedDataItem);

            if (children && children.length) {
              for (let i = 1; i <= children.length; i++) {
                let child = data.objectAt(oldDataIndex + i);
                data.insertAt(newDataIndex + 1 + i, child);
              }

            } else if (hiddenChildren && hiddenChildren.length) {
              for (let i = 1; i <= hiddenChildren.length; i++) {
                let child = data.objectAt(oldDataIndex + i);

                data.insertAt(newDataIndex + i + 1, child);
              }
            }
          }



          // Fire animations after the render from data moves has completed
          Ember.run.scheduleOnce('afterRender', () => {
            if (this && !this.get('isDestroyed')) {
              if (up) {
                // drag up
                let target, orig;

                if (children && children.length) {
                  orig = this.$('.droppable:gt(' + (oldIndex + children.length) + '):lt(' + (children.length + 1) +')');
                  target = this.$('.droppable:gt(' + (newIndex - 1) + '):lt(' + (children.length + 1) + ')');
                } else {
                  orig = this.$('.droppable:eq(' + (oldIndex + 1) + ')');
                  target = this.$('.droppable:eq(' + (newIndex) + ')');
                }

                this._applyClasses(orig, null, ['dragging']);

                orig.animate({
                  height: '0px'
                }, ANIMATE_SPEED, () => {
                  // note, this fires for every el animated out, which will take care of each of the children
                  const hiddenCount = (hiddenChildren) ? hiddenChildren.length : 0;

                  data.removeAt(oldDataIndex + 1 + children.length + hiddenCount);
                  Ember.run.next( () => {
                    orig.css('height', '');
                  });

                  // hidden children aren't shown, so they don't animate out, we've added them down, now need
                  // to remove the old references
                  if (hiddenChildren && hiddenChildren.length) {
                    for (let i = 0; i < hiddenChildren.length; i++) {
                      data.removeAt(oldDataIndex + 1 + hiddenCount);
                    }

                  }
                });

                target.css('height', '0px');
                target.css('opacity', '0.4');

                // animate new one in
                target.animate({
                  height: `${clientHeight}px`,
                  opacity: 1
                }, ANIMATE_SPEED, function() {
                  target.css('height', '');
                  target.css('opacity', '');
                });


              } else {
                // drag down
                let target, orig;

                if (children && children.length) {
                  if (oldIndex === 0) {
                    orig = this.$('.droppable:gt(' + (oldIndex) + '):lt(' + (children.length + 1) +')');
                  } else {
                    orig = this.$('.droppable:gt(' + (oldIndex - 1) + '):lt(' + (children.length + 1) +')');
                  }
                  target = this.$('.droppable:gt(' + (newIndex) + '):lt(' + (children.length + 1) + ')');
                } else {
                  orig = this.$('.droppable:eq(' + (oldIndex) + ')');
                  target = this.$('.droppable:eq(' + (newIndex + 1) + ')');
                }


                this._applyClasses(target, null, ['dragging']);

                if (orig) {
                  // animate original out
                  orig.animate({
                    height: '0px'
                  }, ANIMATE_SPEED, () => {
                    // note, this fires for every el animated out, which will take care of each of the children
                    data.removeAt(oldDataIndex);
                    Ember.run.next( () => {
                      orig.css('height', '');
                    });

                    // hidden children aren't shown, so they don't animate out, we've added them down, now need
                    // to remove the old references
                    if (hiddenChildren && hiddenChildren.length) {
                      for (let i = 0; i < hiddenChildren.length; i++) {
                        data.removeAt(oldDataIndex);
                      }

                    }
                  });
                }


                target.css('height', '0px');
                target.css('opacity', '0.4');

                // animate new one in
                target.animate({
                  height: `${clientHeight}px`,
                  opacity: 1
                }, ANIMATE_SPEED, function() {
                  target.css('height', '');
                  target.css('opacity', '');
                });
              }
            }
          });

          this.set('_dragGroup', null);

          let childCount = (children) ? children.length : 0;
          if (childCount === 0) {
            if (hiddenChildren && hiddenChildren.length) {
              childCount = hiddenChildren.length;
            }
          }

          // If we're dragging a group down, the new index will be off because
          // of the order we have to do things to make the animations work. We
          // fix/adjust it here
          let adjustedIndex = newDataIndex;
          if (childCount && (oldDataIndex < newDataIndex)) {
            adjustedIndex = newDataIndex - childCount;
          }


          // tricky...we can't fire this until our copy of the data has completed its
          // runloop updates. Next isn't long enough, neither is schedule after render,
          // as there are things in that queue that have to go first.

          Ember.run.later( () => {
            this.get('onOrderChanged')(draggedDataItem, oldDataIndex, adjustedIndex, isChild, childCount);
          }, 800);
        }
      }
    });
  },

  willDestroyElement() {
    this.$().off('dragstart.karbonsortable');
    this.$().off('dragend.karbonsortable');
    this.$().off('dragover.karbonsortable');
    this.$().off('dragleave.karbonsortable');
    this.$().off('drop.karbonsortable');
    this.$().off('drag.karbonsortable');
  }
});
