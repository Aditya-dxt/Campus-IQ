import numpy as np


def train_test_split(X, y, test_size=0.2, seed=42):
    m = X.shape[0]
    np.random.seed(seed)
    indices = np.random.permutation(m)
    
    test_count = int(np.floor(m * test_size))

    test_indices = indices[:test_count]  # first `test_count` entries of `indices`
    train_indices = indices[test_count:]  # the rest of `indices`

    X_train, X_test = X[train_indices], X[test_indices]
    y_train, y_test = y[train_indices], y[test_indices]
    
    return X_train, X_test, y_train, y_test

