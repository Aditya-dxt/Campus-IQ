from sigmoid import sigmoid
from log_loss import average_log_loss
from gradient_descent import compute_gradient
from update_weight import update_weights
import numpy as np

def train(X, y, weights, alpha, epochs):
    for epoch in range(epochs):
        z = X @ weights
        y_hat = sigmoid(z)
        loss = average_log_loss(y, y_hat)
        gradient = compute_gradient(X, y, y_hat)
        weights = update_weights(weights, gradient, alpha)

        if epoch % 100 == 0:
            print(f"Epoch {epoch}, Loss: {loss}")

    return weights



if __name__ == "__main__":
    X = np.array([[0.2, 0.5], [0.9, 0.8], [0.1, 0.2], [0.95, 0.9]])  # e.g., [attendance, marks] normalized 0-1
    y = np.array([1, 0, 1, 0])  # made-up at-risk labels
    weights = np.zeros(X.shape[1])
    alpha = 0.1
    epochs = 500

    final_weights = train(X, y, weights, alpha, epochs)
    print(final_weights)