import argparse
import os
import sys
import unittest

from test_command_injection import (
    login,
    test_pdf_command_injection,
    test_ping_command_injection,
    test_simple_command_injection,
    test_system_info_injection,
)
from test_idor import test_idor
from test_invoicer_jwt import JWTVulnerabilityTest
from test_path_traversal import PathTraversalTest
from test_sqli import (
    test_credit_check_sqli,
    test_init_sample_data,
    test_order_creation_sqli,
    test_safe_search,
    test_search_sqli,
)
from test_ssrf import SSRFTest


def create_test_suite():
    """Create a test suite containing all vulnerability tests."""
    suite = unittest.TestSuite()

    # Add unittest-based tests
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(PathTraversalTest))
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(SSRFTest))

    # Get token for command injection tests
    token = login()
    if token:
        # Add function-based tests that require token
        suite.addTest(
            unittest.FunctionTestCase(lambda: test_simple_command_injection(token))
        )
        suite.addTest(
            unittest.FunctionTestCase(lambda: test_pdf_command_injection(token))
        )
        suite.addTest(
            unittest.FunctionTestCase(lambda: test_ping_command_injection(token))
        )
        suite.addTest(
            unittest.FunctionTestCase(lambda: test_system_info_injection(token))
        )
    else:
        print("Warning: Command injection tests will be skipped due to login failure")

    # Add other function-based tests
    suite.addTest(unittest.FunctionTestCase(test_idor))

    # Add JWT tests
    jwt_tester = JWTVulnerabilityTest()
    suite.addTest(unittest.FunctionTestCase(jwt_tester.test_normal_flow))
    suite.addTest(unittest.FunctionTestCase(jwt_tester.test_token_forgery))
    suite.addTest(unittest.FunctionTestCase(jwt_tester.test_cross_environment))
    suite.addTest(unittest.FunctionTestCase(jwt_tester.test_token_expiration_bypass))

    # Add SQL injection tests
    suite.addTest(unittest.FunctionTestCase(test_init_sample_data))
    suite.addTest(unittest.FunctionTestCase(test_search_sqli))
    suite.addTest(unittest.FunctionTestCase(test_credit_check_sqli))
    suite.addTest(unittest.FunctionTestCase(test_order_creation_sqli))
    suite.addTest(unittest.FunctionTestCase(test_safe_search))

    return suite


def list_tests():
    """List all available tests."""
    print("\nAvailable unittest-based tests:\n")

    # List unittest-based tests
    for test_class in [PathTraversalTest, SSRFTest]:
        print(f"{test_class.__name__}:")
        for name in unittest.TestLoader().getTestCaseNames(test_class):
            test = getattr(test_class, name)
            doc = test.__doc__ or "No description available"
            print(f"  {name} - {doc}")
        print()

    # List function-based tests
    print("Available function-based tests:\n")
    modules = {
        "test_command_injection": [
            test_simple_command_injection,
            test_pdf_command_injection,
            test_ping_command_injection,
            test_system_info_injection,
        ],
        "test_idor": [test_idor],
        "test_sqli": [
            test_init_sample_data,
            test_search_sqli,
            test_credit_check_sqli,
            test_order_creation_sqli,
            test_safe_search,
        ],
    }

    for module_name, functions in modules.items():
        print(f"{module_name}:")
        for func in functions:
            doc = func.__doc__ or "No description available"
            print(f"  {func.__name__} - {doc}")
        print()

    # List JWT tests
    print("test_invoicer_jwt:")
    jwt_tester = JWTVulnerabilityTest()
    for name in [
        "test_normal_flow",
        "test_token_forgery",
        "test_cross_environment",
        "test_token_expiration_bypass",
    ]:
        test = getattr(jwt_tester, name)
        doc = test.__doc__ or "No description available"
        print(f"  {name} - {doc}")
    print()


def main():
    parser = argparse.ArgumentParser(description="Run vulnerability tests")
    parser.add_argument("--list", action="store_true", help="List all available tests")
    parser.add_argument(
        "--test",
        help="Run a specific test (format: class_name.test_name or function_name)",
    )
    args = parser.parse_args()

    if args.list:
        list_tests()
        return

    if args.test:
        # Run specific test
        if "." in args.test:
            class_name, test_name = args.test.split(".")
            test_class = globals().get(class_name)
            if test_class:
                suite = unittest.TestLoader().loadTestsFromName(test_name, test_class)
            else:
                print(f"Test class {class_name} not found")
                return
        else:
            if args.test.startswith("test_jwt_"):
                jwt_tester = JWTVulnerabilityTest()
                test_func = getattr(jwt_tester, args.test, None)
                if test_func:
                    suite = unittest.TestSuite([unittest.FunctionTestCase(test_func)])
                else:
                    print(f"JWT test function {args.test} not found")
                    return
            elif args.test.startswith("test_") and args.test in globals():
                test_func = globals()[args.test]
                if test_func.__module__ == "test_command_injection":
                    token = login()
                    if token:
                        suite = unittest.TestSuite(
                            [unittest.FunctionTestCase(lambda: test_func(token))]
                        )
                    else:
                        print(
                            "Error: Could not run command injection test due to login failure"
                        )
                        return
                else:
                    suite = unittest.TestSuite([unittest.FunctionTestCase(test_func)])
            else:
                print(f"Test function {args.test} not found")
                return
    else:
        # Run all tests
        suite = create_test_suite()

    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(suite)


if __name__ == "__main__":
    main()
