import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { createStore, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux';
import { loadState, saveState } from './localStorage';
import { v4 } from 'node-uuid';
import './index.css';
import expect from 'expect';
var deepFreeze = require('deep-freeze');

const todo = (state, action) => {
	switch (action.type) {
		case 'ADD_TODO':
			return {
				id: action.id,
				text: action.text,
				completed: false
			};
		case 'TOGGLE_TODO':
			if (state.id !== action.id) {
				return state;
			}
			return {
				...state,
				completed: !state.completed
			};
	}
};

const todos = (state = [], action) => {
	switch (action.type) {
		case 'ADD_TODO':
			return [...state, todo(undefined, action)];
		case 'TOGGLE_TODO':
			return state.map(t => todo(t, action));
		default:
			return state;
	}
	return;
};

const visibilityFilter = (state = 'SHOW_ALL', action) => {
	switch (action.type) {
		case 'SET_VISIBILITY_FILTER':
			return action.filter;
		default:
			return state;
	}
};

const todoApp = combineReducers({
	todos,
	visibilityFilter
});

const testAddTodo = () => {
	const stateBefore = [];
	const action = {
		id: 0,
		type: 'ADD_TODO',
		text: 'Learn Redux'
	};
	const stateAfter = [
		{
			id: 0,
			text: 'Learn Redux',
			completed: false
		}
	];

	deepFreeze(stateBefore);
	deepFreeze(action);

	expect(todos(stateBefore, action)).toEqual(stateAfter);
};

const testToggleTodo = () => {
	const stateBefore = [
		{
			id: 0,
			text: 'Learn Redux',
			completed: false
		},
		{
			id: 1,
			text: 'Go shopping',
			completed: false
		}
	];
	const action = {
		id: 1,
		type: 'TOGGLE_TODO'
	};
	const stateAfter = [
		{
			id: 0,
			text: 'Learn Redux',
			completed: false
		},
		{
			id: 1,
			text: 'Go shopping',
			completed: true
		}
	];

	deepFreeze(stateBefore);
	deepFreeze(action);

	expect(todos(stateBefore, action)).toEqual(stateAfter);
};

export const addTodo = text => ({
	type: 'ADD_TODO',
	id: v4(),
	text
});

export const setVisibilityFilter = filter => ({
	type: 'SET_VISIBILITY_FILTER',
	filter
});

export const toggleTodo = id => ({
	type: 'TOGGLE_TODO',
	id
});

const { Component } = React;

const Link = ({ active, children, onClick }) => {
	if (active) {
		return <span>{children}</span>;
	}
	return (
		<a
			href="#"
			onClick={e => {
				e.preventDefault();
				onClick();
			}}
		>
			{children}
		</a>
	);
};

const mapStateToProps = (state, ownProps) => ({
	active: ownProps.filter === state.visibilityFilter
});
const mapDispatchToProps = (dispatch, ownProps) => ({
	onClick() {
		dispatch(setVisibilityFilter(ownProps.filter));
	}
});
const FilterLink = connect(mapStateToProps, mapDispatchToProps)(Link);

const Footer = () => (
	<p>
		Show: <FilterLink filter="SHOW_ALL">All</FilterLink>
		{', '}
		<FilterLink filter="SHOW_ACTIVE">Active</FilterLink>
		{', '}
		<FilterLink filter="SHOW_COMPLETED">Completed</FilterLink>
	</p>
);

const Todo = ({ onClick, completed, text }) => (
	<li
		onClick={onClick}
		style={{
			textDecoration: completed ? 'line-through' : 'none'
		}}
	>
		{text}
	</li>
);

const TodoList = ({ todos, onTodoClick }) => (
	<ul>
		{todos.map(todo => (
			<Todo key={todo.id} {...todo} onClick={() => onTodoClick(todo.id)} />
		))}
	</ul>
);

let AddTodo = ({ dispatch }) => {
	let input;

	return (
		<div>
			<input
				ref={node => {
					input = node;
				}}
			/>
			<button
				onClick={() => {
					dispatch(addTodo(input.value));
					input.value = '';
				}}
			>
				Add Todo
			</button>
		</div>
	);
};
AddTodo = connect()(AddTodo); // Does not subscribe to the store, only injects the dispatch function in AddTodo

const getVisibleTodos = (todos, filter) => {
	switch (filter) {
		case 'SHOW_COMPLETED':
			return todos.filter(t => t.completed);
		case 'SHOW_ACTIVE':
			return todos.filter(t => !t.completed);
		default:
			return todos;
	}
};

const mapStateToTodoListProps = state => ({
	todos: getVisibleTodos(state.todos, state.visibilityFilter)
});
const mapDispatchToTodoListProps = dispatch => ({
	onTodoClick: id => dispatch(toggleTodo(id))
});
const VisibleTodoList = connect(
	mapStateToTodoListProps,
	mapDispatchToTodoListProps
)(TodoList);

const TodoApp = () => (
	<div>
		<AddTodo />
		<VisibleTodoList />
		<Footer />
	</div>
);

const persistedState = loadState();

const store = createStore(todoApp, persistedState);

store.subscribe(() => {
	saveState({ todos: store.getState().todos });
});

ReactDOM.render(
	<Provider store={store}>
		<TodoApp />
	</Provider>,
	document.getElementById('root')
);

testAddTodo();
testToggleTodo();
console.log('All tests passed.');
