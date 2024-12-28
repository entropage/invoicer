# Test-Driven Development (TDD) Workflow

## Core Cycle
1. Write a failing test (Red)
2. Write minimal code to make test pass (Green)
3. Refactor while keeping tests green (Refactor)

## Key Principles
- Never write new functionality without a failing test
- Make tests fail for the right reason
- Write minimal code to pass tests
- Refactor to remove duplication

## Implementation Workflow

```python
def setup_test_environment():
    """Initialize test dependencies and environment"""
    setup_test_db()
    setup_test_fixtures()
    clear_logs()

def validate_test_fails(test_case):
    """Ensure test properly fails first (red phase)"""
    result = run_test(test_case)
    assert not result.passed, "New test should fail first"
    return result.error_message

def refactor_if_needed(test_case):
    """Clean up code while keeping tests green"""
    while needs_refactoring():
        refactor_code()
        if not test_case.passed:
            revert_changes()
            return False
    return True

def ensure_pass(test_case):
    while True:
        check_logs(server_log, test_log)
        
        if test_case.passed:
            if refactor_if_needed(test_case):
                git_commit()
                return True
            continue
            
        edit_code()
        if server_code_changed:
            try:
                build()
                run()
            except BuildError:
                revert_last_change()
                continue
        
        test()

def dev_in_tdd():
    # Setup phase
    read(plan, test_plan)
    setup_test_environment()
    
    # Test creation phase
    test_cases = add_test_cases()
    
    # Validation phase
    for test_case in test_cases:
        error_message = validate_test_fails(test_case)
        log_initial_failure(test_case, error_message)
    
    # Implementation phase
    for test_case in test_cases:
        ensure_pass(test_case)
```

## Notes
- Always check logs after each test run
- Build and run server if server code changes
- Commit only after tests pass and refactoring is complete
- Revert changes if build fails or refactoring breaks tests
