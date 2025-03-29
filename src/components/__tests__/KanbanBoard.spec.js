import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import KanbanBoard from '../KanbanBoard.vue'

describe('KanbanBoard', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(KanbanBoard)
  })

  it('renders properly', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('DLC Meals')
  })

  it('has the correct number of columns', () => {
    const columns = wrapper.findAll('.task-list')
    expect(columns).toHaveLength(7) // Monday through Sunday
  })

  it('switches between Daddy and Family views', async () => {
    const daddyLink = wrapper.find('a[href="#"]:first-child')
    const familyLink = wrapper.find('a[href="#"]:last-child')

    expect(wrapper.vm.activeView).toBe('daddy')

    await familyLink.trigger('click')
    expect(wrapper.vm.activeView).toBe('family')

    await daddyLink.trigger('click')
    expect(wrapper.vm.activeView).toBe('daddy')
  })
}) 